import { BadgePlus, BadgeMinus, ArrowDown } from "lucide-react";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  address: string;
  date: string;
  description: string;
}

const transactions: Record<string, Transaction[]> = {
  "community-development": [
    {
      id: "tx-1",
      type: "deposit",
      amount: 35,
      address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
      date: "2025-03-18T14:32:26Z",
      description: "Đóng góp cho quỹ phát triển cộng đồng"
    },
    {
      id: "tx-2",
      type: "deposit",
      amount: 20,
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      date: "2025-03-17T09:15:10Z",
      description: "Đóng góp cho quỹ phát triển cộng đồng"
    },
    {
      id: "tx-3",
      type: "withdrawal",
      amount: 15,
      address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
      date: "2025-03-15T16:45:33Z",
      description: "Tài trợ cho dự án phát triển ứng dụng di động"
    },
    {
      id: "tx-4",
      type: "deposit",
      amount: 50,
      address: "0xa1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
      date: "2025-03-12T10:22:15Z",
      description: "Đóng góp cho quỹ phát triển cộng đồng"
    },
    {
      id: "tx-5",
      type: "withdrawal",
      amount: 25,
      address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
      date: "2025-03-10T13:55:42Z",
      description: "Tài trợ cho hội thảo trực tuyến về blockchain"
    }
  ],
  "innovation": [
    {
      id: "tx-6",
      type: "deposit",
      amount: 100,
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      date: "2025-03-20T11:23:45Z",
      description: "Đóng góp cho quỹ đổi mới sáng tạo"
    },
    {
      id: "tx-7",
      type: "deposit",
      amount: 75,
      address: "0x8731d54E9D02c286767d56ac03e8037C07e01e98",
      date: "2025-03-18T14:36:22Z",
      description: "Đóng góp cho quỹ đổi mới sáng tạo"
    },
    {
      id: "tx-8",
      type: "withdrawal",
      amount: 30,
      address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
      date: "2025-03-16T09:12:18Z",
      description: "Tài trợ cho dự án nghiên cứu kết hợp AI và blockchain"
    },
    {
      id: "tx-9",
      type: "deposit",
      amount: 45,
      address: "0xa1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
      date: "2025-03-14T16:48:33Z",
      description: "Đóng góp cho quỹ đổi mới sáng tạo"
    },
    {
      id: "tx-10",
      type: "withdrawal",
      amount: 25,
      address: "0x1a2B3c4D5e6F7g8H9i0J1k2L3m4N5o6P7q8R9s0T",
      date: "2025-03-12T10:25:42Z",
      description: "Tài trợ cho phát triển cầu nối liên chuỗi"
    }
  ]
};

export function FundTransactions({ fundId }: { fundId: string }) {
  const fundTransactions = transactions[fundId] || [];

  if (fundTransactions.length === 0) {
    return <div className="text-center py-10">Không có giao dịch nào.</div>;
  }

  return (
    <div className="space-y-4">
      {fundTransactions.map((transaction) => (
        <div key={transaction.id} className="flex items-start gap-4 p-4 border-b last:border-0">
          <div className={
            transaction.type === "deposit" 
              ? "w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0"
              : "w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0"
          }>
            {transaction.type === "deposit" ? (
              <BadgePlus className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <BadgeMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="font-medium truncate">
                  {transaction.description}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {transaction.address.slice(0, 6)}...{transaction.address.slice(-4)}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <p className={
                  transaction.type === "deposit" 
                    ? "font-semibold text-green-600 dark:text-green-400" 
                    : "font-semibold text-red-600 dark:text-red-400"
                }>
                  {transaction.type === "deposit" ? "+" : "-"}{transaction.amount} ADA
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="text-center pt-4">
        <button className="text-sm text-muted-foreground flex items-center gap-1 mx-auto">
          Xem thêm
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}