import Image from "next/image";
import Script from "next/script";

export default function Page() {
  return (
    <>
      <Script
        id="klaviyo-onsite"
        strategy="afterInteractive"
        src="https://static.klaviyo.com/onsite/js/TqGyCz/klaviyo.js?company_id=TqGyCz"
      />

      <div className="h-screen flex justify-center flex-col items-center gap-4 px-6">
        <Image
          src="/images/w-pull-logo.png"
          width={100}
          height={100}
          alt="W-Pulls"
        />

        <h3 className="text-3xl text-cyan-500 font-semibold tracking-wide">
          WPulls
        </h3>

        <div className="klaviyo-form-X2JQrP"></div>
      </div>
    </>
  );
}
