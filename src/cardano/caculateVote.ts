import axios from 'axios';
import { blockchainProvider } from '@/cardano/adapter';
import { deserializeDatum } from '@meshsdk/core';

const PROJECT_ID = 'previewxOC094xKrrjbuvWPhJ8bkiSoABW4jpDc';

interface VoteResult {
  yesVoters: { address: string; txHash: string }[];
  noVoters: { address: string; txHash: string }[];
  totalVoters: number;
}

export async function fetchVoter(address: string): Promise<VoteResult> {
  const options = {
    method: 'GET',
    url: `https://cardano-preview.blockfrost.io/api/v0/addresses/${address}/txs`,
    headers: { project_id: PROJECT_ID },
    params: {
      order: 'desc',
      count: '100',
      page: '1',
    },
  };

  const latestVotes = new Map<string, { vote: string; txHash: string }>(); // Lưu vote và txHash

  try {
    const { data } = await axios.request<string[]>(options);
    for (const tx of data) {
      const utxos = await blockchainProvider.fetchUTxOs(tx);
      const utxosWithPlutus = utxos.filter((utxo: any) => utxo.output.plutusData !== undefined);

      for (const utxo of utxosWithPlutus) {
        const datum = deserializeDatum(utxo.output.plutusData);
        const vote = hexToString(datum.fields[1].bytes).toLowerCase();

        // Tìm địa chỉ bỏ phiếu: địa chỉ khác với address truyền vào trong cùng giao dịch
        let voterAddress: string | null = null;
        for (const otherUtxo of utxos) {
          const otherAddress = otherUtxo.output.address;
          if (otherAddress !== address) {
            voterAddress = otherAddress;
            break; // Lấy địa chỉ đầu tiên khác với address truyền vào
          }
        }

        // Nếu không tìm thấy địa chỉ bỏ phiếu, bỏ qua phiếu này
        if (!voterAddress) continue;

        // Chỉ lưu phiếu nếu chưa có phiếu của địa chỉ này (giao dịch đã sắp xếp từ mới đến cũ)
        if (!latestVotes.has(voterAddress)) {
          latestVotes.set(voterAddress, { vote, txHash: tx });
        }
      }
    }

    // Tạo danh sách yesVoters và noVoters từ các phiếu mới nhất
    const yesVoters: { address: string; txHash: string }[] = [];
    const noVoters: { address: string; txHash: string }[] = [];
    for (const [voterAddress, voteData] of latestVotes) {
      if (voteData.vote === 'yes') {
        yesVoters.push({ address: voterAddress, txHash: voteData.txHash });
      } else if (voteData.vote === 'no') {
        noVoters.push({ address: voterAddress, txHash: voteData.txHash });
      }
    }

    const totalVoters = latestVotes.size;

    return { yesVoters, noVoters, totalVoters };
  } catch (error) {
    console.error(`Lỗi khi lấy giao dịch cho địa chỉ ${address}:`, error);
    return { yesVoters: [], noVoters: [], totalVoters: 0 };
  }
}

function hexToString(hex: string): string {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (!isNaN(code)) str += String.fromCharCode(code);
  }
  return str;
}

async function main() {
  const result = await fetchVoter('addr_test1wr93u5xcszjgerll0p3zrpqfatuyyd9sdxt38j4g6qr5h2s7d4fkt');
  console.log('Kết quả phiếu bầu:', result);
}

main();