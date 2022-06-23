import { l1Provider } from "@lib/chains";
import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  TextField,
  Heading,
  Text,
  Label,
  Badge,
  Link,
} from "@livepeer/design-system";
import { useEffect, useMemo, useState } from "react";
import { useSignTypedData, useAccount, useProvider } from "wagmi";
import { CodeBlock } from "./CodeBlock";
import Spinner from "./Spinner";
import { DOMAIN, TYPES } from "../constants/typedData";

export type Stream = {
  name: string;
  blockHash: string;
};

export type SignedStream = {
  message: Stream;
  signature: string;
};

const CreateStreamDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (stream: Stream) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [signature, setSignature] = useState("");
  const [blockHashAndNumber, setBlockHashAndNumber] = useState({
    hash: "",
    number: -1,
  });
  const [updateTime, setUpdateTime] = useState(-1);

  const { data } = useAccount();

  useEffect(() => {
    setUpdateTime(Date.now());

    const intervalId = setInterval(() => {
      setUpdateTime(Date.now());
    }, 5000);

    return () => clearInterval(intervalId);
  }, [setUpdateTime]);

  useEffect(() => {
    (async () => {
      const blockNumber = await l1Provider.getBlockNumber();
      const currentBlock = await l1Provider.getBlock(blockNumber);

      const currentBlockHash = currentBlock.hash;

      setBlockHashAndNumber({ hash: currentBlockHash, number: blockNumber });
    })();
  }, [updateTime]);

  const value: Stream = useMemo(
    () => ({
      name: streamName,
      blockHash: blockHashAndNumber.hash ?? "",
    }),
    [streamName, blockHashAndNumber]
  );

  const { signTypedDataAsync, variables } = useSignTypedData({
    domain: DOMAIN,
    types: TYPES,
    value,
  });

  const signedStream: SignedStream = useMemo(
    () => ({ message: value, signature: signature }),
    [value, signature]
  );

  const streamKey = variables
    ? Buffer.from(JSON.stringify(signedStream)).toString("base64")
    : undefined;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Sign a new stream key</Heading>
        </AlertDialogTitle>

        <Text size="2" css={{ mt: "$3" }}>Latest Ethereum block</Text>
        <Link
          target="_blank"
          rel="noopener noreferrer"
          href={`https://etherscan.io/block/${blockHashAndNumber.hash}`}
        >
          <Flex align="center" css={{ mt: "$1" }}>
            <Text css={{ fontWeight: 700 }}>#{blockHashAndNumber.number}</Text>
            <Badge css={{ ml: "$1" }} variant="primary">
              {blockHashAndNumber.hash.replace(
                blockHashAndNumber.hash.slice(5, 60),
                "…"
              )}
            </Badge>
          </Flex>
        </Link>

        {signature && streamKey ? (
          <Box>
            <Text css={{ mt: "$3", mb: "$4" }}>
              {`Stream key created! Please copy your ${streamKey.length} character base64-encoded stream key and store it in a safe place.`}
            </Text>

            <CodeBlock id="streamkey" css={{}}>
              {streamKey}
            </CodeBlock>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <AlertDialogCancel asChild>
                <Button size="2">Done</Button>
              </AlertDialogCancel>
            </Flex>
          </Box>
        ) : (
          <Box
            css={{ mt: "$3" }}
            as="form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (creating) {
                return;
              }
              setCreating(true);
              try {
                const signature = await signTypedDataAsync();

                setSignature(signature);

                onCreate(value);
              } catch (error) {
                console.error(error);
              } finally {
                setCreating(false);
              }
            }}
          >
            <Flex direction="column" gap="2">
              <Label htmlFor="firstName">Stream name</Label>
              <TextField
                required
                size="2"
                type="text"
                id="firstName"
                autoFocus={true}
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                placeholder="DayDAO Monday Hangouts"
              />
            </Flex>
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="gray"
                css={{ mt: "$2", fontSize: "$2", mb: "$4" }}
              >
                Stream keys are an EIP-712 signed representation of the
                parameters for a stream, with the latest Ethereum blockhash for
                proof-of-age.
              </Text>
            </AlertDialogDescription>

            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <AlertDialogCancel asChild>
                <Button disabled={creating} size="2" ghost>
                  Cancel
                </Button>
              </AlertDialogCancel>
              <Button
                css={{ display: "flex", ai: "center" }}
                type="submit"
                size="2"
                disabled={creating || !streamName}
                variant="primary"
              >
                {creating && (
                  <Spinner
                    css={{
                      color: "$hiContrast",
                      width: 16,
                      height: 16,
                      mr: "$2",
                    }}
                  />
                )}
                Sign stream key
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateStreamDialog;
