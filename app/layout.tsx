import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Aura — Dress the skin you have today",
  description:
    "A skin-state styling studio for fashion retail. YouCam Skin AI reads today's face. Apparel VTO shows the look on your body. One cart for clothes and care.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans text-mist antialiased`}>
        {children}
      </body>
    </html>
  );
}
