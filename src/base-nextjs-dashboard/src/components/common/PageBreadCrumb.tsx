import { useI18n } from "@/context/I18nContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface BreadcrumbProps {
  pageTitle?: string; // Make it optional
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ }) => {
  const pathname = usePathname();
  const { t } = useI18n();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);

    return paths
      .map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");

        // Check if path is a MongoDB ID
        const isId = /^[0-9a-fA-F]{24}$/.test(path);

        // Check if next segment is "edit"
        const nextIsEdit =
          index < paths.length - 1 && paths[index + 1] === "edit";

        // Skip detail breadcrumb if ID is followed by edit
        if (isId && nextIsEdit) {
          return null;
        }

        // Build translation key
        let key = "";
        if (isId) {
          key = `${paths[0]}_detail`;
        } else if (index === 0) {
          key = path;
        } else {
          key = `${paths[0]}_${path}`;
        }

        const label = t(`breadcrumbs.${key}`) || path;

        return { href, label };
      })
      .filter((crumb): crumb is { href: string; label: string } => crumb !== null);
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              href="/"
            >
              {t("breadcrumbs.dashboard")}
              <svg
                className="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    href={crumb.href}
                  >
                    {crumb.label}
                  </Link>
                  <svg
                    className="stroke-current text-gray-500 dark:text-gray-400"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              ) : (
                <span className="text-sm text-gray-800 dark:text-white/90">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
