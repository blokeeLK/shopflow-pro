import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";

export function CustomHtmlBlock({ section }: { section: "home_html" | "header_html" | "footer_html" }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    supabase
      .from("site_html" as any)
      .select(section)
      .eq("id", "singleton")
      .single()
      .then(({ data }) => {
        if (data && (data as any)[section]) {
          setHtml(DOMPurify.sanitize((data as any)[section]));
        }
      });
  }, [section]);

  if (!html) return null;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
