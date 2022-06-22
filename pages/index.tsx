import CreateStreamDialog from "@components/CreateStreamDialog";
import { getLayout } from "@layouts/main";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import { useState } from "react";
import { useAccount } from "wagmi";

const BLOCK_HASH_KEY = "block-hash-signed";

const Home = () => {
  const account = useAccount();

  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState(false);

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

          <Box
            css={{
              mb: "$8",
              maxWidth: 600,
            }}
          >
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

          <CreateStreamDialog
            onCreate={async (stream) => {
              if (window && localStorage) {
                localStorage.setItem(BLOCK_HASH_KEY, stream.blockHash);
              }
            }}
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
