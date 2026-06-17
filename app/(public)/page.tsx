import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-8">
      <Image
        src="/images/w-pull-logo.png"
        width={90}
        height={90}
        alt="wpulls"
      />
      <h3 className="uppercase font-semibold text-cyan-300 text-3xl">
        WPULLS COMING SOON
      </h3>
    </div>
  );
};

export default page;
