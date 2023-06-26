import AppBar from "@components/AppBar";
import ConnectButton from "@components/ConnectButton";
import Drawer from "@components/Drawer";
import Hamburger from "@components/Hamburger";
import Logo from "@components/Logo";
import { globalStyles } from "@lib/globalStyles";
import * as fcl from "@onflow/fcl";
import {
  Box,
  Text,
  Button,
  Container,
  DesignSystemProvider,
  Flex,
  SnackbarProvider,
  themes,
} from "@livepeer/design-system";
import { EyeOpenIcon } from "@modulz/radix-icons";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import useWindowSize from "react-use/lib/useWindowSize";
import { MutationsContext } from "../contexts";
import {
  useAccountAddress,
  useActiveChain,
  useMutations,
  useOnClickOutside,
} from "../hooks";
import { background } from "@chakra-ui/react";

const themeMap = {};
Object.keys(themes).map(
  (key, _index) => (themeMap[themes[key].className] = themes[key].className)
);

type DrawerItem = {
  name: any;
  href: string;
  as: string;
  icon: React.ElementType;
  className?: string;
};

const FlowLogo = () => {
  return (
    <div className="App">
      <svg width="30" height="42" viewBox="0 0 50 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.8333 41.8334C32.3393 41.8334 41.6667 32.506 41.6667 21.0001C41.6667 9.49415 32.3393 0.166748 20.8333 0.166748C9.3274 0.166748 0 9.49415 0 21.0001C0 32.506 9.3274 41.8334 20.8333 41.8334Z" fill="#00EF8B"></path>
        <path d="M29.9732 17.7417H24.0898V23.625H29.9732V17.7417Z" fill="white"></path>
        <path d="M18.2138 25.8292C18.2138 26.266 18.0843 26.6929 17.8416 27.0561C17.599 27.4192 17.2541 27.7023 16.8506 27.8694C16.447 28.0366 16.003 28.0803 15.5746 27.9951C15.1463 27.9099 14.7528 27.6996 14.4439 27.3907C14.1351 27.0819 13.9248 26.6884 13.8396 26.26C13.7544 25.8316 13.7981 25.3876 13.9652 24.9841C14.1324 24.5806 14.4154 24.2357 14.7786 23.993C15.1417 23.7504 15.5687 23.6209 16.0055 23.6209H18.2138V17.7417H16.0055C14.4059 17.7417 12.8423 18.216 11.5123 19.1047C10.1823 19.9934 9.14572 21.2564 8.5336 22.7342C7.92147 24.212 7.76131 25.8382 8.07337 27.407C8.38543 28.9758 9.15569 30.4169 10.2867 31.5479C11.4178 32.679 12.8589 33.4492 14.4277 33.7613C15.9965 34.0733 17.6226 33.9132 19.1004 33.3011C20.5782 32.6889 21.8413 31.6523 22.73 30.3224C23.6186 28.9924 24.093 27.4287 24.093 25.8292V23.6209H18.2138V25.8292Z" fill="white"></path>
        <path d="M26.2984 14.8001H32.9151V8.91675H26.2984C24.1542 8.91895 22.0984 9.77174 20.5821 11.288C19.0659 12.8042 18.2131 14.86 18.2109 17.0042V17.7417H24.0901V17.0042C24.0912 16.4193 24.3244 15.8587 24.7384 15.4454C25.1524 15.0322 25.7135 14.8001 26.2984 14.8001V14.8001Z" fill="white"></path>
      </svg>
    </div>
  );
}

const FlowWallet = () => {
  const [user, setUser] = useState({loggedIn: null})

  useEffect(() => {fcl.currentUser.subscribe(setUser)}, [])

  const auth = async () => {
    try {
      fcl.config({
        "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
        "flow.network": "testnet",
        "accessNode.api": "https://access-testnet.onflow.org"
      })

      await fcl.authenticate();
    } catch (error) {
      console.log(error);
    }
  };

  const AuthedState = () => {
    return (
      <Box>
        <Text size="2">Address: {user?.addr ?? "No Address"}</Text>
        <Button onClick={fcl.unauthenticate}>Disconnect</Button>
      </Box>
    )
  }

  const UnauthenticatedState = () => {
    return (
      <Box>
        <Button onClick={auth} css={{ background: "#113123",  color: "#4cc38a", fontSize: "16px" }}>Connect Wallet</Button>
      </Box>
    )
  }

  return (user.loggedIn
    ? <AuthedState />
    : <UnauthenticatedState />
  )
}

const Layout = ({ children, title = "Sign Verifiable Video Attestation", networkType="eth"}) => {
  const { pathname, asPath } = useRouter();

  const mutations = useMutations();
  const activeChain = useActiveChain();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const { width } = useWindowSize();
  const ref = useRef();

  useEffect(() => {
    if (width > 1020) {
      document.body.removeAttribute("style");
    }

    if (width < 1020 && drawerOpen) {
      document.body.style.overflow = "hidden";
    }
  }, [drawerOpen, width]);

  const items: DrawerItem[] = [
    {
      name: "Overview",
      href: "/",
      as: "/",
      icon: EyeOpenIcon,
      className: "overview",
    },
  ];

  Router.events.on("routeChangeComplete", () =>
    document.body.removeAttribute("style")
  );

  const onDrawerOpen = () => {
    document.body.style.overflow = "hidden";
    setDrawerOpen(true);
  };
  const onDrawerClose = () => {
    document.body.removeAttribute("style");
    setDrawerOpen(false);
  };

  useOnClickOutside(ref, () => {
    onDrawerClose();
  });

  globalStyles();

  return (
    <DesignSystemProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="dark"
        value={{
          ...themeMap,
          dark: "dark-theme-green",
          light: "light-theme-green",
        }}
      >
        <Head>
          <title>{title}</title>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="initial-scale=1.0, width=device-width"
          />
        </Head>
        <SnackbarProvider>
          <MutationsContext.Provider value={mutations}>
            <Box css={{ height: "calc(100vh - 82px)" }}>
              <Box css={{}}>
                <Box
                  css={{
                    "@bp3": {
                      display: "none",
                    },
                  }}
                  ref={ref}
                >
                  <Drawer
                    onDrawerClose={onDrawerClose}
                    onDrawerOpen={onDrawerOpen}
                    open={drawerOpen}
                    items={items}
                  />
                </Box>
                <Box>
                  <AppBar
                    css={{
                      zIndex: 10,
                    }}
                    size="2"
                    color="neutral"
                    border
                    sticky
                  >
                    <Container size="3">
                      <Flex
                        css={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          height: 40,
                        }}
                      >
                        <Box
                          css={{
                            "@bp3": {
                              py: "$3",
                              display: "none",
                            },
                          }}
                        >
                          <Hamburger onClick={onDrawerOpen} />
                        </Box>
                        <Flex
                          css={{
                            display: "none",
                            "@bp3": {
                              height: "100%",
                              justifyContent: "center",
                              display: "flex",
                              mr: "$3",
                              mt: "$2",
                            },
                          }}
                        >
                          <Logo isDark id="main" />

                          <Box css={{}}>
                            <Link passHref href="/">
                              <Button
                                size="3"
                                css={{
                                  ml: "$4",
                                  bc:
                                    asPath === "/"
                                      ? "hsla(0,100%,100%,.05)"
                                      : "transparent",
                                  color: "white",
                                  "&:hover": {
                                    bc: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    bc: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                Ethereum Verifiable Video
                              </Button>
                            </Link>
                          </Box>
                          <Box css={{}}>
                            <Link passHref href="/flow">
                              <Button
                                size="3"
                                css={{
                                  ml: "$2",
                                  bc:
                                    asPath === "/flow"
                                      ? "hsla(0,100%,100%,.05)"
                                      : "transparent",
                                  color: "white",
                                  "&:hover": {
                                    bc: "hsla(0,100%,100%,.1)",
                                  },
                                  "&:active": {
                                    bc: "hsla(0,100%,100%,.15)",
                                  },
                                  "&:disabled": {
                                    opacity: 0.5,
                                  },
                                }}
                              >
                                Flow Verifiable Video
                              </Button>
                            </Link>
                          </Box>
                        </Flex>

                        <Flex css={{ ml: "auto" }}>
                          <Flex
                            align="center"
                            css={{
                              fontWeight: 600,
                              px: "$2",
                              fontSize: "$2",
                              display: "none",
                              ai: "center",
                              mr: "$2",
                              "@bp1": {
                                display: "flex",
                              },
                            }}
                          >
                            { networkType === "eth" &&
                              <Image
                                objectFit="contain"
                                width={18}
                                height={18}
                                alt={
                                  (
                                    CHAIN_INFO[activeChain?.id] ??
                                    CHAIN_INFO[DEFAULT_CHAIN_ID]
                                  ).label
                                }
                                src={
                                  (
                                    CHAIN_INFO[activeChain?.id] ??
                                    CHAIN_INFO[DEFAULT_CHAIN_ID]
                                  ).logoUrl
                                }
                              />
                            }
                            { networkType === "eth" &&
                              <Box css={{ ml: "8px" }}>
                                {
                                  (
                                    CHAIN_INFO[activeChain?.id] ??
                                    CHAIN_INFO[DEFAULT_CHAIN_ID]
                                  ).label
                                }
                              </Box>
                            }
                            { networkType === "flow" && <FlowLogo/> }
                            { networkType === "flow" &&
                              <Box css={{ ml: "8px" }}>
                                Flow
                              </Box>
                            }
                              
                          </Flex>
                          <Flex css={{ ai: "center", ml: "8px" }}>
                              { networkType === "eth" && <ConnectButton showBalance={false} /> }
                              { networkType === "flow" && <FlowWallet/> }
                          </Flex>
                        </Flex>
                      </Flex>
                    </Container>
                  </AppBar>
                  <Flex
                    css={{
                      position: "relative",
                      width: "100%",
                      backgroundColor: "$loContrast",
                    }}
                  >
                    <Box css={{ width: "100%" }}>{children}</Box>
                  </Flex>
                </Box>
              </Box>
            </Box>
          </MutationsContext.Provider>
        </SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProvider>
  );
};

export const getLayout = (page) => <Layout>{page}</Layout>;

export default Layout;
