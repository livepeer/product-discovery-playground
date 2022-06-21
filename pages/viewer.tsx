import { gql, useQuery } from "@apollo/client";
import { CodeBlock } from "@components/CodeBlock";
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
import { CheckCircledIcon, CheckIcon, PersonIcon } from "@modulz/radix-icons";
import { useEffect, useMemo, useState } from "react";
import { Player } from "video-react";

const Viewer = () => {
  // const { data: protocolData } = useQuery(gql`
  //   {
  //     protocol(id: "0") {
  //       id
  //       currentRound {
  //         id
  //       }
  //     }
  //   }
  // `);

  const [isOpen, setIsOpen] = useState(false);
  const [streamKey, setStreamKey] = useState("");
  const [ensName, setEnsName] = useState("");

  const streamParams = useMemo(
    () =>
      streamKey
        ? JSON.parse(Buffer.from(streamKey, "base64").toString())
        : null,
    [streamKey]
  );

  useEffect(() => {
    (async () => {
      if (streamParams?.message?.owner) {
        const name = await l1Provider.lookupAddress(
          streamParams?.message?.owner
        );

        if (name) {
          setEnsName(name);
        }
      }
    })();
  }, [streamParams]);

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
            View
          </Heading>

          <Box css={{ maxWidth: 600 }}>
            <Text css={{ mb: "$3" }}>
              Watch content based on a signed stream key.
            </Text>
            <TextField
              placeholder="Base64-encoded stream key"
              size="2"
              css={{
                mb: "$2",
              }}
              onChange={(e) => setStreamKey(e.target.value)}
            />
            <Button
              variant="primary"
              size={2}
              onClick={() => setIsOpen((curr) => !curr)}
            >
              Verify & View Stream
            </Button>

            {isOpen && streamKey && (
              <Box css={{ mt: "$4" }}>
                <Text css={{ mb: "$3" }}>Stream parameters:</Text>
                <CodeBlock id="streamkey" css={{ mb: "$3" }}>
                  {JSON.stringify(streamParams, null, 2)}
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
                    <Flex align="center">
                      <Text
                        size="2"
                        css={{
                          mr: "$1",
                          fontWeight: 600,
                        }}
                      >
                        {ensName
                          ? ensName
                          : streamParams?.message?.owner?.replace(
                              streamParams?.message?.owner?.slice(5, 38),
                              "…"
                            ) ?? ""}
                      </Text>
                      <CheckCircledIcon />
                    </Flex>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};

Viewer.getLayout = getLayout;

export default Viewer;
