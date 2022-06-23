import { getLayout } from "@layouts/main";
import Hash from "ipfs-only-hash";

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

import Spinner from "@components/Spinner";
import { UploadResponse } from "pages/api/upload-metadata";
import Link from "next/link";
import { l1Provider } from "@lib/chains";
import { DOMAIN, VOD_TYPES } from "constants/typedData";
import { SignedVideo, Video } from "pages/api/asset/create";

const Viewer = () => {
  const account = useAccount();

  const [isUploading, setIsUploading] = useState(false);

  const [errorUpload, setErrorUpload] = useState("");

  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string>("");

  const [signature, setSignature] = useState("");
  const [blockHashAndNumber, setBlockHashAndNumber] = useState({
    hash: "",
    number: 0,
  });
  const [updateTime, setUpdateTime] = useState(-1);

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

  const value: Video = useMemo(
    () => ({
      ipfsHash: ipfsHash ?? "",
      blockHash: blockHashAndNumber.hash ?? "",
    }),
    [ipfsHash, blockHashAndNumber]
  );

  const { signTypedDataAsync } = useSignTypedData({
    domain: DOMAIN,
    types: VOD_TYPES,
    value,
  });

  const onSubmitFile = async () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", fileUpload);

    try {
      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });
      if (res.status === 200) {
        const json: UploadResponse = await res.json();

        if (json.hash) {
          const signature = await signTypedDataAsync({
            domain: DOMAIN,
            types: VOD_TYPES,
            value: { ...value, ipfsHash: json.hash },
          });

          try {
            const res = await fetch("/api/upload-metadata", {
              method: "POST",
              body: JSON.stringify({
                ipfsHash: json.hash,
                blockHash: blockHashAndNumber.hash,
                signature: signature,
              }),
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
            Upload Signed Video
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

            <Flex css={{ justifyContent: "flex-end", alignItems: "center" }}>
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
                Sign & Upload Video
              </Button>
            </Flex>
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