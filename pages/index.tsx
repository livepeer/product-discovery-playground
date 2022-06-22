import { CodeBlock } from "@components/CodeBlock";
import CreateStreamDialog, {
  DOMAIN,
  SignedStream,
  Stream,
  TYPES,
} from "@components/CreateStreamDialog";
import { getLayout } from "@layouts/main";
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
import { verifyTypedData } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { Player } from "video-react";
import { useAccount } from "wagmi";

const Home = () => {
  const account = useAccount();

  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);

  const [isHover, setIsHover] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ethAddress, setEthAddress] = useState("");
  const [ensName, setEnsName] = useState("");

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
    (async () => {
      if (ethAddress) {
        const name = await l1Provider.lookupAddress(ethAddress);

        if (name) {
          setEnsName(name);
        }
      }
    })();
  }, [ethAddress]);

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
            Stream
          </Heading>

          <Box css={{ maxWidth: 600 }}>
            <Text css={{ mb: "$3" }}>
              Create a unique stream key, signed and owned by you to broadcast
              live video content and playback your live stream with the
              underlying Livepeer protocol.
            </Text>
            <Button
              disabled={!account?.data?.address}
              variant="primary"
              size={2}
              onClick={() => setIsStreamDialogOpen((curr) => !curr)}
            >
              Generate stream key
            </Button>
          </Box>
          <Box css={{ mt: "$8", maxWidth: 600 }}>
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
              View
            </Heading>
            <Text css={{ mb: "$3" }}>
              Watch content based on an Ethereum address.
            </Text>
            <TextField
              placeholder="Ethereum address (0xab9...)"
              size="2"
              css={{
                mb: "$2",
              }}
              onChange={(e) => setEthAddress(e.target.value)}
            />
            <Button
              variant="primary"
              size={2}
              onClick={() => setIsOpen((curr) => !curr)}
            >
              Verify & View Stream
            </Button>

            {isOpen && ethAddress && (
              <Box css={{ mt: "$4" }}>
                <Text css={{ mb: "$3" }}>Stream parameters:</Text>
                <CodeBlock id="ethAddress" css={{ mb: "$3" }}>
                  {JSON.stringify(ethAddress, null, 2)}
                </CodeBlock>
                <Box css={{ position: "relative" }}>
                  <Player src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" />
                  <Box
                    css={{
                      position: "absolute",
                      top: 10,
                      right: 12,
                    }}
                  >
                    <Flex
                      css={{
                        height: 20,
                        color: "white",
                        "&:hover": {
                          color: "hsla(0,100%,100%,.85)",
                        },
                        cursor: "pointer",
                      }}
                      align="center"
                      onMouseEnter={() => setIsHover(true)}
                      onMouseLeave={() => setIsHover(false)}
                    >
                      {isHover && (
                        <Text
                          size="2"
                          css={{
                            mr: "$1",
                            fontWeight: 600,
                          }}
                        >
                          {ensName
                            ? ensName
                            : ethAddress?.replace(
                                ethAddress?.slice(5, 38),
                                "…"
                              ) ?? ""}
                        </Text>
                      )}
                      <Box as={CheckCircledIcon} />
                    </Flex>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          <CreateStreamDialog
            onCreate={async (name) => {}}
            onOpenChange={(isOpen) => setIsStreamDialogOpen(isOpen)}
            isOpen={isStreamDialogOpen}
          />
        </Flex>
      </Container>
    </>
  );
};

Home.getLayout = getLayout;

export default Home;
