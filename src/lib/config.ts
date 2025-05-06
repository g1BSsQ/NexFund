// src/lib/config.ts

/** Base URL được định nghĩa trong .env */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

/** Tập hợp các endpoint của backend PHP */
export const ENDPOINTS = {
  CHECK_MEMBERSHIP:    `${API_BASE}/check_membership.php`,
  CREATE_FUND:         `${API_BASE}/create_fund.php`,
  CREATE_INVITATION:   `${API_BASE}/create_invitation.php`,
  CREATE_PROPOSAL:     `${API_BASE}/create_proposal.php`,
  DELETE_INVITATION:   `${API_BASE}/delete_invitation.php`,
  GET_DASHBOARD_STATS: `${API_BASE}/get_dashboard_stats.php`,
  GET_FUND_DETAILS:    `${API_BASE}/get_fund_details.php`,
  GET_FUND_MEMBERS:    `${API_BASE}/get_fund_members.php`,
  GET_PROPOSAL_DETAILS:`${API_BASE}/get_proposal_details.php`,
  GET_PROPOSALS:       `${API_BASE}/get_proposals.php`,
  GET_PUBLIC_FUNDS:    `${API_BASE}/get_public_funds.php`,
  JOIN_FUND:           `${API_BASE}/join_fund.php`,
  USER_DATA:           `${API_BASE}/user_data.php`,
};

export const BLOCKFROST_API_URL    = process.env.NEXT_PUBLIC_BLOCKFROST_API_URL!;
export const BLOCKFROST_PROJECT_ID = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!;
export const COINGECKO_API_URL     = process.env.NEXT_PUBLIC_COINGECKO_API_URL!;