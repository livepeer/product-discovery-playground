import Layout from "@layouts/main";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  TextArea,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import * as fcl from "@onflow/fcl";

import Spinner from "@components/Spinner";
import { TypedDataField } from "@ethersproject/abstract-signer";
import { useCreateAsset } from "@livepeer/react";
import stringify from "fast-stable-stringify";

type VideoAttributes = {
  video: string;
  timestamp: number;
  signer: string;
  attestations: {
    role: string;
    address: string;
  }[];
};

type AttestationResponse = {
  id: string;
  signatureType: "eip712";
  createdAt: 1686334888047;
  primaryType: "VideoAttestation";
  domain: {
    name: string;
    version: string;
  };
  message: {
    video: string;
    timestamp: number;
    signer: string;
    attestations: [
      {
        role: "creator";
        address: string;
      }
    ];
  };
  signature: string;
  storage: {
    ipfs: {
      cid: "abcdef"
    }
  }
};

const livepeerHost = () => {
  if (process.env.NEXT_PUBLIC_LIVEPEER_ENV === "prod") {
    return "https://livepeer.studio";
  }
  return "https://livepeer.monster";
}

const Main = ({networkType}) => {
  const account = useAccount();

  const [user, setUser] = useState({loggedIn: null})
  useEffect(() => {fcl.currentUser.subscribe(setUser)}, [])

  const [isUploading, setIsUploading] = useState(false);

  const [errorUpload, setErrorUpload] = useState("");
  const [attestation, setAttestation] = useState<AttestationResponse | null>(null);

  const [fileUpload, setFileUpload] = useState<File | null>(null);

  const [statusInfo, setStatusInfo] = useState("");

  const {
    progress,
    isLoading,
    data: asset,
    error,
    mutate,
  } = useCreateAsset({
    sources: fileUpload
      ? [
          {
            file: fileUpload,
            name: fileUpload.name,
            storage: {
              ipfs: true,
              metadataTemplate: "file",
            },
          },
        ]
      : [],
  });

  useEffect(() => {
    if (fileUpload) {
      mutate();
    }
  }, [fileUpload]);

  useEffect(() => {
    if (attestation) {
      let message = "";
      if (attestation.storage?.ipfs?.cid) {
        message = `Attestation uploaded to IPFS: ipfs://${attestation.storage?.ipfs?.cid}`
      } else {
        message = `Attestation uploaded, storing to IPFS...`
      }
      message += "\n\n";
      message += "Attestation Content:\n"
      const attestationMetadata = {
        primaryType: attestation.primaryType,
        domain: attestation.domain,
        message: attestation.message,
        signature: attestation.signature,
        signatureType: attestation.signatureType
      }
      message += JSON.stringify(attestationMetadata, null, 2)
      setStatusInfo(message);
    } else if (asset?.[0]?.storage?.ipfs?.url) {
      setStatusInfo(`Video uploaded to IPFS: ${asset?.[0]?.storage?.ipfs?.url}`)
    } else if (progress || fileUpload) {
      if (progress?.[0].progress) {
        setStatusInfo(`Video uploading (phase: ${progress[0].phase}, progress: ${Math.round(progress[0].progress * 100)}%)`)
      } else {
        setStatusInfo(`Video uploading...`)
      }
    } else if (isWalletConnected()) {
      setStatusInfo("Upload a video.")
    } else {
      setStatusInfo("Connect wallet to upload a video.")
    }
  }, [progress, isLoading, asset, user, account, attestation, fileUpload]);

  const [jsonSchema, setJsonSchema] = useState<object | null>(null);
  const [signatureTypes, setSignatureTypes] = useState<Record<
    string,
    TypedDataField[]
  > | null>(null);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/attestation.schema.json`);
      const json = await result.json();

      setJsonSchema(json);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const result = await fetch(`/json-schemas/attestation.types.json`);
      const json = await result.json();

      setSignatureTypes(json);
    })();
  }, []);
  const { signTypedDataAsync } = useSignTypedData();

  const isWalletConnected = () => {
    if (networkType === "eth") {
      return account?.data?.address
    } else if (networkType === "flow") {
      return user.loggedIn;
    }
  }

  const address = () => {
    if (networkType === "eth") {
      return account.data.address;
    } else if (networkType === "flow") {
      return user?.addr;
    }
  }

  const sign = async (domain, message) => {
    if (networkType == "eth") {
      return await signTypedDataAsync({
        domain,
        types: signatureTypes,
        value: message,
      });
    } else if (networkType === "flow") {
      fcl.config({
        "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
        "flow.network": "testnet",
        "accessNode.api": "https://access-testnet.onflow.org"
      })
      const signatures = await fcl
      .currentUser()
      .signUserMessage(Buffer.from(stringify(message)).toString("hex"));
      return signatures[0].signature;
    }
  }

  const onSubmitMetadata = async () => {
    setIsUploading(true);
    setErrorUpload("");

    const domain = {
      name: "Verifiable Video",
      version: "1",
    };

    try {
      const message: VideoAttributes = {
        video: asset?.[0]?.storage?.ipfs?.url ?? "",
        timestamp: Date.now(),
        signer: address(),
        attestations: [
          {
            role: "creator",
            address: address(),
          },
        ],
      };

      const signature = await sign(domain, message);

      try {
        const data = {
          primaryType: "VideoAttestation",
          domain,
          message,
          signature: signature,
        };

        let res = await fetch(
          `${livepeerHost()}/api/experiment/-/attestation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (res.ok) {
          let json: AttestationResponse = await res.json();
          const attestationId = json.id;
          if (attestationId) {
            while (!json?.storage?.ipfs?.cid) {
              res = await fetch(`${livepeerHost()}/api/experiment/-/attestation/${attestationId}`);
              json = await res.json();
              setAttestation(json);
              await (new Promise(resolve => setTimeout(resolve, 1000)))
            }
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
            Create a Verified Video
          </Heading>

          <Box css={{ maxWidth: 600 }}>
            <Text css={{ mb: "$3" }}>
              Create a verified video with decentralized storage (IPFS) and play
              it back with the Livepeer protocol.
            </Text>

            <Flex
              css={{
                gap: "$3",
                mb: "$3",
                mt: "$3",
              }}
            >
              <Flex css={{ flexDirection: "column" }}>
                <Text size="2" css={{ fontWeight: 700, paddingBottom: "12px" }}>
                  Upload a video to IPFS
                </Text>

                {isWalletConnected() && (
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
                    asset?.[0]?.storage?.ipfs?.url ||
                    !isWalletConnected() ||
                    isUploading ||
                    fileUpload
                  }
                  variant="primary"
                  size={2}
                >
                  {isLoading && <Spinner />}
                  <label htmlFor="contained-button-file">Upload Video</label>
                </Button>
              </Flex>
            </Flex>

            {jsonSchema && asset?.[0]?.storage?.ipfs?.url && (
              <Flex css={{ paddingBottom:"2px" }}>
                <Button
                  disabled={!fileUpload || isUploading || attestation }
                  variant="primary"
                  size={2}
                  onClick={onSubmitMetadata}
                >
                  Sign & Create Attestation
                </Button>
              </Flex>
            )}

            <Flex>
              {errorUpload ? (
                <Text css={{ color: "$red11", mt: "$3" }}>
                  {errorUpload || "Error with address."}
                </Text>
              ) : isUploading ? (
                <Box css={{ mt: "$4" }}>
                  <Spinner />
                </Box>
              ) : attestation?.id ? (
                <a
                  target="_blank"
                  href={`https://experiment.lvpr.tv/?v=${attestation?.storage?.ipfs?.cid}`}
                  rel="noreferrer"
                >
                  <Button css={{ mt: "$2" }} variant="primary" size={2}>
                    View Uploaded Video
                  </Button>
                </a>
              ) : (
                <></>
              )}
            </Flex>
            <Flex css={{ paddingTop: "30px" }}>
              <Flex css={{ flexDirection: "column", width: "500px" }}>
                <Text size="2" css={{ fontWeight: 700, paddingBottom: "5px" }}>
                  Status Info
                </Text>
                <TextArea readOnly={true} value={statusInfo}></TextArea>
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export default Main;
