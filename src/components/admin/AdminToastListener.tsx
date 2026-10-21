"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { notify } from "@/lib/toast";

export function AdminToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handledRef = useRef<string>("");

  useEffect(() => {
    if (!searchParams) return;

    const saved = searchParams.get("saved");
    const deleted = searchParams.get("deleted");
    const updated = searchParams.get("updated");
    const ordered = searchParams.get("ordered");
    const added = searchParams.get("added");
    const removed = searchParams.get("removed");

    const key = `${pathname}?${searchParams.toString()}`;
    if (handledRef.current === key) return;

    let handled = false;

    if (saved === "1") {
      if (pathname.includes("/categories")) {
        notify.success("Category saved", {
          description: "Category information has been saved successfully.",
          id: "admin-category-saved",
        });
      } else if (pathname.includes("/downloads")) {
        notify.success("Software download saved", {
          description: "Software download item has been saved successfully.",
          id: "admin-download-saved",
        });
      } else {
        notify.success("Product saved", {
          description: "Product catalog item has been saved successfully.",
          id: "admin-product-saved",
        });
      }
      handled = true;
    } else if (deleted === "1") {
      if (pathname.includes("/categories")) {
        notify.success("Category deleted", {
          description: "Category has been removed successfully.",
          id: "admin-category-deleted",
        });
      } else if (pathname.includes("/downloads")) {
        notify.success("Software download deleted", {
          description: "Software download item has been removed successfully.",
          id: "admin-download-deleted",
        });
      } else {
        notify.success("Product deleted", {
          description: "Product has been removed from the catalog.",
          id: "admin-product-deleted",
        });
      }
      handled = true;
    } else if (updated === "1") {
      notify.success("Order updated", {
        description: "Order status has been updated successfully.",
        id: "admin-order-updated",
      });
      handled = true;
    } else if (ordered === "1") {
      notify.success("Sort order saved", {
        description: "Display order has been updated successfully.",
        id: "admin-order-saved",
      });
      handled = true;
    } else if (added === "1") {
      notify.success("Products added", {
        description: "Products have been copied to this category.",
        id: "admin-products-added",
      });
      handled = true;
    } else if (removed === "1") {
      notify.info("Product removed", {
        description: "Product was removed from this category.",
        id: "admin-product-removed",
      });
      handled = true;
    }

    if (handled) {
      handledRef.current = key;
      // Clean up URL query parameters without reloading
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("saved");
      nextParams.delete("deleted");
      nextParams.delete("updated");
      nextParams.delete("ordered");
      nextParams.delete("added");
      nextParams.delete("removed");

      const cleanQuery = nextParams.toString();
      const cleanUrl = cleanQuery ? `${pathname}?${cleanQuery}` : pathname;
      router.replace(cleanUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}

