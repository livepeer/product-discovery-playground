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
import { DOMAIN } from "../constants/typedData";

import Ajv from "ajv";
import { FormProps, withTheme } from "@rjsf/core";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import { TypedDataField } from "@ethersproject/abstract-signer";
import { UploadResponse } from "pages/api/upload-metadata";
import { IPFS_CONTENT_KEY } from "./StreamPage";
import { ethers } from "ethers";

const Form = withTheme(ChakraUITheme) as React.FunctionComponent<FormProps<{}>>;

const ajv = new Ajv();

export type SignedStream = {
  /**
   * The signed content
   */
  body: StreamAttributes;
  /**
   * The signature over the content ID hash
   */
  sig: string;
};

/**
 * The signed content
 */
export type StreamAttributes = {
  /**
   * Identifier with URL prefix associated with protocol
   */
  cid: string;
};

/**
 * The stored signed content
 */
export type StreamStoredAttributes = {
  /**
   * Block hash on Ethereum L1 when payload was signed
   */
  creationBlockHash: string;
  /**
   * Describes the video contents
   */
  description: string;
  /**
   * The name of the video
   */
  name: string;
  /**
   * EOA or contract address for the owner(s)
   */
  ownerAddress: string;
};

const CreateStreamDialog = ({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorUpload, setErrorUpload] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [blockHashAndNumber, setBlockHashAndNumber] = useState({
    hash: "",
    number: -1,
  });
  const [updateTime, setUpdateTime] = useState(-1);

  const account = useAccount();

  const [signatureTypes, setSignatureTypes] = useState<Record<
    string,
    TypedDataField[]
  > | null>(null);

  const [jsonSchema, setJsonSchema] = useState<object | null>(null);
  const [streamSignatureSchema, setStreamSignatureSchema] = useState<
    object | null
  >(null);
  const [formData, setFormData] = useState<{
    name?: string;
    description?: string;
    ownerAddress?: string;
    creationBlockHash?: string;
  } | null>();

  useEffect(() => {
    if (account.data?.address) {
      setFormData((prev) => ({ ...prev, ownerAddress: account.data.address }));
    }
  }, [account.data]);

  useEffect(() => {
    if (blockHashAndNumber.hash) {
      setFormData((prev) => ({
        ...prev,
        creationBlockHash: blockHashAndNumber.hash,
      }));
    }
  }, [blockHashAndNumber.hash]);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/1-owner-stream.schema.json`);
      const json = await result.json();

      setJsonSchema(json);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/stream-signature.types.json`);
      const json = await result.json();

      setSignatureTypes(json);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/stream-signature.schema.json`);
      const json = await result.json();

      setStreamSignatureSchema(json);
    })();
  }, []);

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

  const { signTypedDataAsync } = useSignTypedData();

  const onSubmitMetadata = async (e) => {
    e.preventDefault();
    if (isGenerating || !account.data?.address) {
      return;
    }
    setErrorUpload("");
    setIsGenerating(true);

    try {
      const storedAttributes: StreamStoredAttributes = {
        creationBlockHash: formData.creationBlockHash,

        name: formData.name,
        description: formData.description,
        ownerAddress: formData.ownerAddress,
      };

      const res = await fetch("/api/upload-metadata", {
        method: "POST",
        body: JSON.stringify(storedAttributes),
      });

      if (res.status === 200) {
        const json: UploadResponse = await res.json();

        if (json.hash) {
          const streamAttributes: StreamAttributes = {
            cid: `ipfs://${json.hash}`,
          };

          const signature = await signTypedDataAsync({
            domain: DOMAIN,
            types: signatureTypes,
            value: streamAttributes,
          });

          const signedStream: SignedStream = {
            body: streamAttributes,
            sig: signature,
          };

          const valid = ajv.validate(streamSignatureSchema, signedStream);
          if (!valid) {
            throw new Error("Invalid signed stream payload");
          }

          if (window && localStorage) {
            localStorage.setItem(
              IPFS_CONTENT_KEY,
              JSON.stringify(storedAttributes)
            );
          }

          // setStreamKey(encodeURIComponent(JSON.stringify(signedStream)));

          setStreamKey(
            Buffer.from(
              `${signedStream.body.cid}|${signedStream.sig}`
            ).toString("base64")
          );
        } else {
          setErrorUpload(json.error);
        }
      } else {
        setErrorUpload("Error uploading, please try again.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Sign a new stream key</Heading>
        </AlertDialogTitle>

        {errorUpload && (
          <Text css={{ color: "$red11", mt: "$3" }}>
            {errorUpload || "Error with address."}
          </Text>
        )}

        {streamKey ? (
          <Box>
            <Text css={{ mt: "$3", mb: "$4" }}>
              {`Stream key created! Please copy your ${streamKey.length} character key and paste it into OBS, or store it in a safe place.`}
            </Text>

            <CodeBlock id="streamkey" css={{}}>
              {streamKey}
            </CodeBlock>

            <Text css={{ mt: "$3", mb: "$4" }}>
              {`The ingest endpoint should be configured to be:`}
            </Text>

            <CodeBlock id="streamkey" css={{}}>
              {"rtmp://ingest.livepeer.name/live"}
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
            }}
          >
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
            <Text size="2" css={{ mt: "$2" }}>
              Latest Ethereum block
            </Text>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`https://etherscan.io/block/${blockHashAndNumber.hash}`}
            >
              <Flex align="center" css={{ mb: "$3" }}>
                <Text css={{ fontWeight: 700 }}>
                  #{blockHashAndNumber.number}
                </Text>
                <Badge css={{ ml: "$1" }} variant="primary">
                  {blockHashAndNumber.hash.replace(
                    blockHashAndNumber.hash.slice(5, 60),
                    "…"
                  )}
                </Badge>
              </Flex>
            </Link>
            <Flex direction="column">
              {jsonSchema && (
                <Form
                  // disabled={!ipfsCreatedHash}
                  schema={jsonSchema}
                  formData={formData}
                  onChange={(e, es) => {
                    setFormData(e.formData);
                  }}
                  uiSchema={{
                    // hide creation block hash since this is auto-populated
                    creationBlockHash: { "ui:widget": "hidden" },
                  }}
                  onSubmit={onSubmitMetadata}
                >
                  <Flex
                    css={{ justifyContent: "flex-end", alignItems: "center" }}
                  >
                    <AlertDialogCancel asChild>
                      <Button disabled={isGenerating} size="2" ghost>
                        Cancel
                      </Button>
                    </AlertDialogCancel>
                    <Button
                      disabled={isGenerating}
                      variant="primary"
                      size={2}
                      css={{ ml: "$2" }}
                      onClick={onSubmitMetadata}
                    >
                      {isGenerating && (
                        <Spinner
                          css={{
                            color: "$hiContrast",
                            width: 16,
                            height: 16,
                            mr: "$2",
                          }}
                        />
                      )}
                      Create & Sign Stream Key
                    </Button>
                  </Flex>
                </Form>
              )}
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateStreamDialog;
