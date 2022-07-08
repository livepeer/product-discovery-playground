import { getLayout } from "@layouts/main";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import Ajv from "ajv";

import Spinner from "@components/Spinner";
import { UploadResponse } from "pages/api/upload-metadata";
import Link from "next/link";
import { l1Provider } from "@lib/chains";
import { DOMAIN } from "constants/typedData";
import { FormProps, withTheme } from "@rjsf/core";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import { TypedDataField } from "@ethersproject/abstract-signer";
import { SignedVideo, VideoAttributes } from "pages/api/asset/create";
import { Select } from "@chakra-ui/react";

const Form = withTheme(ChakraUITheme) as React.FunctionComponent<FormProps<{}>>;

const ajv = new Ajv();

const Viewer = () => {
  const account = useAccount();

  const [isUploading, setIsUploading] = useState(false);

  const [errorUpload, setErrorUpload] = useState("");

  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string>("");

  const [ipfsCreatedHash, setIpfsCreatedHash] = useState("");
  const [blockHashAndNumber, setBlockHashAndNumber] = useState({
    hash: "",
    number: 0,
  });
  const [updateTime, setUpdateTime] = useState(-1);

  const [metadataUrl, setMetadataUrl] = useState<
    "1-owner-vod" | "external-id-vod" | null
  >(null);

  const [jsonSchema, setJsonSchema] = useState<object | null>(null);
  const [signatureTypes, setSignatureTypes] = useState<Record<
    string,
    TypedDataField[]
  > | null>(null);

  const [vodSignatureSchema, setVodSignatureSchema] = useState<object | null>(
    null
  );
  const [formData, setFormData] = useState<object | null>();

  useEffect(() => {
    if (account.data?.address && metadataUrl === "1-owner-vod") {
      setFormData((prev) => ({ ...prev, ownerAddress: account.data.address }));
    }
    else {
      setFormData((prev) => ({ ...prev, ownerAddress: undefined }));
    }
  }, [account.data, metadataUrl]);

  useEffect(() => {
    (async () => {
      if (metadataUrl) {
        const result = await fetch(`/json-schemas/${metadataUrl}.schema.json`);
        const json = await result.json();

        setJsonSchema(json);
      }
    })();
  }, [metadataUrl]);

  useEffect(() => {
    (async () => {
      if (metadataUrl) {
        const result = await fetch(`/json-schemas/${metadataUrl}.types.json`);
        const json = await result.json();

        setSignatureTypes(json);
      }
    })();
  }, [metadataUrl]);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/vod-signature.schema.json`);
      const json = await result.json();

      setVodSignatureSchema(json);
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

      const currentBlockHash = currentBlock?.hash;

      setBlockHashAndNumber({ hash: currentBlockHash, number: blockNumber });
    })();
  }, [updateTime]);

  const { signTypedDataAsync } = useSignTypedData();

  const onSubmitFile = async () => {
    setIsUploading(true);
    setErrorUpload("");

    const formDataFile = new FormData();
    formDataFile.append("file", fileUpload);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formDataFile,
      });
      if (res.status === 200) {
        const json: UploadResponse = await res.json();

        if (json.hash) {
          setIpfsCreatedHash(json.hash);
        } else {
          setErrorUpload(json.error);
        }
      } else if (res.status === 413) {
        setErrorUpload("File too large.");
      } else {
        setErrorUpload("Error uploading, please try again.");
      }

      setIsUploading(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmitMetadata = async () => {
    setIsUploading(true);
    setErrorUpload("");

    try {
      const signatureBody: VideoAttributes = {
        contentID: ipfsCreatedHash ? `ipfs://${ipfsCreatedHash}` : "",
        creationBlockHash: blockHashAndNumber.hash ?? "",

        metadata: formData,
      };

      const signature = await signTypedDataAsync({
        domain: DOMAIN,
        types: signatureTypes,
        value: signatureBody,
      });

      try {
        const metadataPayload: SignedVideo = {
          body: signatureBody,
          signer: account.data.address,
          signature: signature,
          signatureTypes: signatureTypes,
        };

        const valid = ajv.validate(vodSignatureSchema, metadataPayload);
        if (!valid) {
          throw new Error("Invalid VOD payload");
        }

        const res = await fetch("/api/upload-metadata", {
          method: "POST",
          body: JSON.stringify(metadataPayload),
        });

        if (res.status === 200) {
          const json: UploadResponse = await res.json();

          if (json.hash) {
            setIpfsHash(json.hash);
          } else {
            setErrorUpload(json.error);
          }
        } else {
          setErrorUpload("Error uploading, please try again.");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsUploading(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

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
              mb: "$5",
              color: "$hiContrast",
              fontSize: "$3",
              fontWeight: 600,
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
            Upload Video to IPFS
          </Heading>

          <Box css={{ maxWidth: 600 }}>
            <Text css={{ mb: "$3" }}>
              Upload a signed video to decentralized storage (IPFS) to be able
              to play back with the Livepeer protocol.
            </Text>

            {blockHashAndNumber.hash && (
              <>
                <Flex
                  css={{ justifyContent: "flex-end", alignItems: "center" }}
                >
                  <Text size="2" css={{ fontWeight: 700, mt: "$3" }}>
                    Latest Ethereum block
                  </Text>
                </Flex>
                <Flex
                  css={{
                    mb: "$4",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <A
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://etherscan.io/block/${blockHashAndNumber.hash}`}
                  >
                    <Flex align="center" css={{ mt: "$1" }}>
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
                  </A>
                </Flex>
              </>
            )}

            <Flex
              css={{
                justifyContent: "flex-end",
                alignItems: "center",
                mb: "$3",
              }}
            >
              {account?.data?.address && (
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  style={{ display: "none" }}
                  id="contained-button-file"
                  onChange={(e) => {
                    if (e?.target?.files?.[0]) {
                      setFileUpload(e.target.files[0]);
                    }
                  }}
                />
              )}

              <Button
                disabled={
                  !account?.data?.address ||
                  isUploading ||
                  fileUpload ||
                  ipfsHash
                }
                variant="primary"
                size={2}
              >
                <label htmlFor="contained-button-file">Select Video</label>
              </Button>
              <Button
                disabled={!fileUpload || isUploading || ipfsHash}
                variant="primary"
                size={2}
                css={{ ml: "$2" }}
                onClick={onSubmitFile}
              >
                Upload Video
              </Button>
            </Flex>
            <Heading
              as="h1"
              css={{
                mb: "$5",
                color: "$hiContrast",
                fontSize: "$3",
                fontWeight: 600,
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
              Add Metadata
            </Heading>

            <Select
              mb={4}
              disabled={!ipfsCreatedHash}
              onChange={(e) =>
                setMetadataUrl(
                  e.target.value === "1-owner-vod"
                    ? "1-owner-vod"
                    : "external-id-vod"
                )
              }
              placeholder="Select metadata schema"
            >
              <option value="1-owner-vod">Single Owner VOD</option>
              <option value="external-id-vod">External ID VOD</option>
            </Select>

            {jsonSchema && (
              <Form
                disabled={!ipfsCreatedHash}
                schema={jsonSchema}
                formData={formData}
                onChange={(e, es) => {
                  setFormData(e.formData);
                }}
                onSubmit={onSubmitMetadata}
              >
                <Flex
                  css={{ justifyContent: "flex-end", alignItems: "center" }}
                >
                  <Button
                    disabled={!fileUpload || isUploading || ipfsHash || !ipfsCreatedHash}
                    variant="primary"
                    size={2}
                    css={{ ml: "$2" }}
                    onClick={onSubmitMetadata}
                  >
                    Sign & Create Metadata
                  </Button>
                </Flex>
              </Form>
            )}

            <Flex css={{ justifyContent: "flex-end", alignItems: "center" }}>
              {errorUpload ? (
                <Text css={{ color: "$red11", mt: "$3" }}>
                  {errorUpload || "Error with address."}
                </Text>
              ) : isUploading ? (
                <Box css={{ mt: "$4" }}>
                  <Spinner />
                </Box>
              ) : ipfsHash ? (
                <Link passHref href={`/video-on-demand/view/${ipfsHash}`}>
                  <Button css={{ mt: "$2" }} variant="primary" size={2}>
                    View Uploaded Video
                  </Button>
                </Link>
              ) : (
                <></>
              )}
            </Flex>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

Viewer.getLayout = getLayout;

export default Viewer;
