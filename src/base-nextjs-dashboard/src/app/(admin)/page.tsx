import type { Metadata } from "next";
import BlogCountStatistic from "../../components/home/blog-count-statistic";
import BlogTopView from "../../components/home/blog-top-view";

export const metadata: Metadata = {
  title: "Base Dashboard",
  description: "Base Dashboard admin panel",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 xl:col-span-5">
        <BlogCountStatistic />
      </div>
      <div className="col-span-12">
        <BlogTopView />
      </div>
    </div>
  );
}
