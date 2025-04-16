import './globals.css';

export const metadata = {
  title: "O's Event Calendar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
