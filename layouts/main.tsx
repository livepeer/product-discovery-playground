import AppBar from "@components/AppBar";
import ConnectButton from "@components/ConnectButton";
import Drawer from "@components/Drawer";
import Hamburger from "@components/Hamburger";
import Logo from "@components/Logo";
import { globalStyles } from "@lib/globalStyles";
import {
  Box,
  Button,
  Container,
  DesignSystemProvider,
  Flex, SnackbarProvider,
  themes
} from "@livepeer/design-system";
import {
  EyeOpenIcon
} from "@modulz/radix-icons";
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
  useOnClickOutside
} from "../hooks";

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

const Layout = ({ children, title = "Livepeer Product Discovery" }) => {
  const { pathname, asPath } = useRouter();

  const mutations = useMutations();
  const accountAddress = useAccountAddress();
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
                                Stream
                              </Button>
                            </Link>
                          </Box>
                          <Box css={{}}>
                            <Link passHref href="/video-on-demand">
                              <Button
                                size="3"
                                css={{
                                  ml: "$2",
                                  bc:
                                    asPath === "/video-on-demand"
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
                                Video On Demand
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
                            <Box css={{ ml: "8px" }}>
                              {
                                (
                                  CHAIN_INFO[activeChain?.id] ??
                                  CHAIN_INFO[DEFAULT_CHAIN_ID]
                                ).label
                              }
                            </Box>
                          </Flex>
                          <Flex css={{ ai: "center", ml: "8px" }}>
                            <ConnectButton showBalance={false} />
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
                    <Box css={{ width: "100%" }}>
                     
                      {children}
                    </Box>
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
