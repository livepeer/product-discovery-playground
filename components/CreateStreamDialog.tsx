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
} from "@livepeer/design-system";
import { useState } from "react";
import { useSignTypedData, useAccount } from "wagmi";
import { CodeBlock } from "./CodeBlock";
import Spinner from "./Spinner";

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
    // { name: "nftGateAddress", type: "string" },
    { name: "owner", type: "address" },
  ],
};

const CreateStreamDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (streamName: string) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [signature, setSignature] = useState("");
  // const [nftAddress, setNftAddress] = useState("");

  const { data } = useAccount();

  const value = {
    name: streamName,
    // nftGateAddress: nftAddress ?? "",
    owner: data?.address ?? "",
  };

  const { signTypedDataAsync, variables } = useSignTypedData({
    domain: DOMAIN,
    types: TYPES,
    value,
  });

  const streamKey = variables
    ? Buffer.from(
        JSON.stringify({ message: variables.value, signature: signature })
      ).toString("base64")
    : undefined;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Sign a new stream key</Heading>
        </AlertDialogTitle>

        {signature && streamKey ? (
          <Box>
            <Text css={{ mt: "$2", mb: "$4" }}>
              {`Stream key created! Please copy your ${streamKey.length} character base64-encoded stream key and store it in a safe place:`}
            </Text>

            <CodeBlock id="streamkey" css={{}}>
              {streamKey}
            </CodeBlock>
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
              {/* <Label htmlFor="nft">NFT Gating Address (optional)</Label>
              <TextField
                size="2"
                type="text"
                id="nftAddress"
                autoFocus={true}
                value={nftAddress}
                onChange={(e) => setNftAddress(e.target.value)}
                placeholder="0xea1234..."
              /> */}
              {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
            </Flex>
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="gray"
                css={{ mt: "$2", fontSize: "$2", mb: "$4" }}
              >
                Stream keys are a EIP-712 signed representation of the
                permissions and rules around a stream.
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
