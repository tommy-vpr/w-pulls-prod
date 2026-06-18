import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="h-screen flex justify-center flex-col items-center gap-4">
      <Image
        src="/images/w-pull-logo.png"
        width={100}
        height={100}
        alt="WPulls"
      />
      <h3 className="text-3xl text-gray-200 font-semibold">WPulls</h3>
    </div>
  );
};

export default page;
