// All properties on a domain are optional
export const DOMAIN = {
  name: "Livepeer",
  version: "1.0.0",
  chainId: 42161,
};

// The named list of all type definitions
export const TYPES = {
  Stream: [
    { name: "name", type: "string" },
    { name: "blockHash", type: "string" },
  ],
};

// The named list of all type definitions
export const VOD_TYPES = {
  Upload: [
    { name: "ipfsHash", type: "string" },
    { name: "blockHash", type: "string" },
  ],
};
