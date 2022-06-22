import { CodeBlock } from "@components/CodeBlock";
import { MistPlayer } from "@components/MistPlayer";
import Spinner from "@components/Spinner";
import { l1Provider } from "@lib/chains";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
} from "@livepeer/design-system";
import { CheckCircledIcon } from "@modulz/radix-icons";
import { useEffect, useState } from "react";
import { Player } from "video-react";
import { useAccount } from "wagmi";

const BLOCK_HASH_KEY = "block-hash-signed";

export const StreamPage = ({
  originalEthAddress,
}: {
  originalEthAddress?: string;
}) => {
  const account = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [ethAddress, setEthAddress] = useState({
    address: originalEthAddress ?? "",
    ensName: "",
  });

  const [blockHash, setBlockHash] = useState("");

  // const streamParams: SignedStream | null = useMemo(
  //   () =>
  //     streamKey
  //       ? (JSON.parse(
  //           Buffer.from(streamKey, "base64").toString()
  //         ) as SignedStream)
  //       : null,
  //   [streamKey]
  // );

  // const recoveredAddress = useMemo(
  //   () =>
  //     streamParams?.message && streamParams?.signature
  //       ? verifyTypedData(
  //           DOMAIN,
  //           TYPES,
  //           streamParams?.message,
  //           streamParams?.signature
  //         )
  //       : null,
  //   [streamParams]
  // );

  useEffect(() => {
    setSearch(originalEthAddress);
  }, [originalEthAddress]);

  useEffect(() => {
    if (window && localStorage) {
      const blockHashLocal = localStorage.getItem(BLOCK_HASH_KEY);

      if (blockHashLocal) {
        setBlockHash(blockHashLocal);
      } else {
        setBlockHash(
          "0x5dd148da1733a676f31577bfe815032b7e6c44ee9a77fd10d61cf5980e76523a"
        );
      }
    }
  }, []);

  return (
    <>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$3",
            width: "100%",
            "@bp3": {
              mt: "$6",
            },
          }}
        >
          <Box css={{ maxWidth: 600 }}>
            <Heading
              as="h1"
              css={{
                color: "$hiContrast",
                fontSize: "$3",
                fontWeight: 600,
                mb: "$5",
                display: "none",
                alignItems: "center",
                "@bp2": {
                  fontSize: "$7",
                },
                "@bp3": {
                  display: "flex",
                  fontSize: "$7",
                },
              }}
            >
              View Stream
            </Heading>
            <Text css={{ mb: "$3" }}>
              Stream live content based on an ENS name or Ethereum address.
            </Text>
            <TextField
              placeholder="Ethereum address (0xab9...)"
              size="2"
              css={{
                mb: "$2",
              }}
              defaultValue={originalEthAddress}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="primary"
              size={2}
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                if (search) {
                  setError("");

                  setIsOpen(true);

                  try {
                    if (search.length === 42) {
                      const name = await l1Provider.lookupAddress(search);

                      if (name) {
                        setEthAddress((prev) => ({ ...prev, ensName: name }));
                      }
                    } else {
                      const address = await l1Provider.resolveName(search);

                      if (address) {
                        setEthAddress((prev) => ({
                          ...prev,
                          ensName: search,
                          address: address,
                        }));
                      }
                    }
                  } catch (e) {
                    console.error(e);
                    setError("Error with ENS name or address.");
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
            >
              Verify & View Stream
            </Button>

            {isOpen &&
              ethAddress &&
              (isLoading ? (
                <Box css={{ mt: "$4" }}>
                  <Spinner />
                </Box>
              ) : error ? (
                <Text css={{ color: "$red11", mt: "$3" }}>
                  {error || "Error with address."}
                </Text>
              ) : (
                <Box css={{ mt: "$4" }}>
                  {/* <Text css={{ mb: "$3" }}>Stream parameters:</Text>
                  <CodeBlock id="ethAddress" css={{ mb: "$3" }}>
                    {JSON.stringify(ethAddress, null, 2)}
                  </CodeBlock> */}
                  <Box css={{ position: "relative" }}>
                    <MistPlayer proof="" />
                    <Box
                      css={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                      }}
                    >
                      <Box>
                        <Flex
                          css={{
                            color: "white",
                            "&:hover": {
                              color: "hsla(0,100%,100%,.85)",
                            },
                            cursor: "pointer",
                            justifyContent: "flex-end",
                          }}
                          align="center"
                          onMouseEnter={() => setIsHover(true)}
                          onMouseLeave={() => setIsHover(false)}
                        >
                          <Box
                            css={{
                              fontSize: "$2",
                              mr: "$1",
                              fontWeight: 600,
                            }}
                          >
                            {ethAddress.ensName
                              ? ethAddress.ensName
                              : ethAddress.address?.replace(
                                  ethAddress.address?.slice(5, 38),
                                  "…"
                                ) ?? ""}
                          </Box>
                          <Box as={CheckCircledIcon} />
                        </Flex>
                        <Flex css={{ justifyContent: "flex-end" }}>
                          {isHover && blockHash && (
                            <Text
                              size="2"
                              css={{
                                mt: "$1",
                                fontWeight: 600,
                              }}
                            >
                              Block Hash:{" "}
                              {blockHash
                                ? blockHash?.replace(
                                    blockHash?.slice(5, 62),
                                    "…"
                                  )
                                : ""}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
          </Box>
        </Flex>
      </Container>
    </>
  );
};
