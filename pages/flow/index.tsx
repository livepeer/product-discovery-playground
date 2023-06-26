import Layout from "@layouts/main";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
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
};

const Viewer = () => {
  const account = useAccount();

  const [user, setUser] = useState({loggedIn: null})

  useEffect(() => {fcl.currentUser.subscribe(setUser)}, [])

  const [isUploading, setIsUploading] = useState(false);

  const [errorUpload, setErrorUpload] = useState("");
  const [attestationId, setAttestationId] = useState("");

  const [fileUpload, setFileUpload] = useState<File | null>(null);

  const {
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

  const isWalletConnected = () => {
    // return account?.data?.address
    return user.loggedIn;
  }

  const address = () => {
    // return account.data.address;
    return user?.addr;
  }

  const onSubmitMetadata = async () => {
    setIsUploading(true);
    setErrorUpload("");

    const domain = {
      name: "Verifiable Video",
      version: "1",
    };

    try {
      const signatureBody: VideoAttributes = {
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

      // Sign Flow data
      const signatures = await fcl
        .currentUser()
        .signUserMessage(Buffer.from(stringify(signatureBody)).toString("hex"));
      const signature = signatures[0].signature;

      try {
        const data = {
          primaryType: "VideoAttestation",
          domain,
          message: signatureBody,
          signature: signature,
        };

        const res = await fetch(
          "https://livepeer.monster/api/experiment/-/attestation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (res.ok) {
          const json: AttestationResponse = await res.json();

          if (json.id) {
            setAttestationId(json.id);
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
                <Text size="2" css={{ fontWeight: 700 }}>
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
              <Flex css={{}}>
                <Button
                  disabled={!fileUpload || isUploading || attestationId}
                  variant="primary"
                  size={2}
                  onClick={onSubmitMetadata}
                >
                  Sign & Create Verifiable Video
                </Button>
              </Flex>
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
              ) : attestationId ? (
                <a
                  target="_blank"
                  href={`https://experiment.lvpr.tv/?v=${attestationId}`}
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
          </Box>
        </Flex>
      </Container>
    </>
  );
};

// Viewer.getLayout = getLayout;

Viewer.getLayout = (page) => {
  return (
    <Layout networkType="flow">
      {page}
    </Layout>
  )
}

export default Viewer;