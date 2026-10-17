import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PubSettings = Database["public"]["Tables"]["pub_settings"]["Row"];
export type PubBook = Database["public"]["Tables"]["pub_books"]["Row"];
export type PubAuthor = Database["public"]["Tables"]["pub_authors"]["Row"];
export type PubCategory = Database["public"]["Enums"]["pub_category"];
export type PubFormat = Database["public"]["Enums"]["pub_format"];

export const IMPRINT = "IHNM Publishing House";
export const IMPRINT_SHORT = "IHNM Publishing";
export const OPERATOR = "IHNM LLC";
export const TAGLINE = "Timeless truth. Today's world.";

/** Everything lives under this prefix today and moves to its own domain later
 *  by changing pub_settings.site_url; no page builds a URL any other way. */
export const PUB_BASE = "/publishing";
export const pubPath = (p = "") => `${PUB_BASE}${p}`;

/** Absolute URL for canonical tags and share images. */
export function pubUrl(settings: PubSettings | undefined, path = ""): string {
  const base = (settings?.site_url ?? "https://books.ihnmshow.com").replace(/\/+$/, "");
  return `${base}${path}`;
}

export const CATEGORIES: { value: PubCategory; label: string }[] = [
  { value: "faith", label: "Faith" },
  { value: "history", label: "History" },
  { value: "christian_living", label: "Christian Living" },
];

export const FORMATS: { value: PubFormat; label: string }[] = [
  { value: "paperback", label: "Paperback" },
  { value: "hardcover", label: "Hardcover" },
  { value: "ebook", label: "Ebook" },
  { value: "audiobook", label: "Audiobook" },
];

export const categoryLabel = (c: PubCategory) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
export const formatLabel = (f: PubFormat) => FORMATS.find((x) => x.value === f)?.label ?? f;

export const pubSettingsQuery = queryOptions({
  queryKey: ["pub_settings"],
  queryFn: async (): Promise<PubSettings | null> => {
    const { data } = await supabase.from("pub_settings").select("*").eq("id", 1).maybeSingle();
    return data;
  },
});

/** Public URL for a file in the publishing bucket. */
export function pubAsset(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from("publishing").getPublicUrl(path).data.publicUrl;
}

export type BookWithAuthors = PubBook & {
  authors: { author: Pick<PubAuthor, "id" | "slug" | "name"> }[];
};

const BOOK_SELECT = "*, authors:pub_book_authors(author:pub_authors(id, slug, name))";

export const booksQuery = queryOptions({
  queryKey: ["pub_books"],
  queryFn: async (): Promise<BookWithAuthors[]> => {
    const { data, error } = await supabase
      .from("pub_books")
      .select(BOOK_SELECT)
      .order("release_date", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as unknown as BookWithAuthors[];
  },
});

export const bookQuery = (slug: string) =>
  queryOptions({
    queryKey: ["pub_book", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pub_books")
        .select(`${BOOK_SELECT}, formats:pub_book_formats(*), endorsements:pub_endorsements(*)`)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as
        | (BookWithAuthors & {
            formats: Database["public"]["Tables"]["pub_book_formats"]["Row"][];
            endorsements: Database["public"]["Tables"]["pub_endorsements"]["Row"][];
          })
        | null;
    },
  });

export const authorsQuery = queryOptions({
  queryKey: ["pub_authors"],
  queryFn: async (): Promise<PubAuthor[]> => {
    const { data, error } = await supabase.from("pub_authors").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const authorQuery = (slug: string) =>
  queryOptions({
    queryKey: ["pub_author", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pub_authors")
        .select("*, books:pub_book_authors(book:pub_books(*))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as (PubAuthor & { books: { book: PubBook }[] }) | null;
    },
  });

/** Buy links are a free-form object so retailers can be added late. */
export const BUY_LINKS: { key: string; label: string }[] = [
  { key: "amazon", label: "Amazon" },
  { key: "barnes_noble", label: "Barnes & Noble" },
  { key: "bookshop", label: "Bookshop.org" },
];
