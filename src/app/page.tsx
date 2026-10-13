import LandingPage from "./landing/page";
import { NativeEntryRedirect } from "@/components/native-entry-redirect";

export default function Home() {
  return (
    <>
      <NativeEntryRedirect />
      <LandingPage />
    </>
  );
}
