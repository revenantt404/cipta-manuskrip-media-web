import { describe, expect, it } from "vitest";
import { catalogueKind } from "./status";

/**
 * Kedua `emptyMessage` adalah teks persis dari brief bagian 9. Tes ini
 * menguncinya supaya perombakan tampilan di Arena nanti tidak menghapus
 * atau mengubah kalimat yang sudah disetujui klien.
 */
describe("catalogueKind", () => {
  it("memetakan telah-terbit ke status published dengan teks brief", () => {
    expect(catalogueKind("telah-terbit")).toEqual({
      status: "published",
      heading: "Buku yang Telah Terbit",
      emptyMessage: "Belum ada buku yang diterbitkan.",
    });
  });

  it("memetakan segera-terbit ke status upcoming dengan teks brief", () => {
    expect(catalogueKind("segera-terbit")).toEqual({
      status: "upcoming",
      heading: "Buku Segera Terbit",
      emptyMessage: "Belum ada buku yang segera terbit.",
    });
  });

  it("mengembalikan null untuk segmen yang tidak dikenal", () => {
    expect(catalogueKind("sedang-ditulis")).toBeNull();
    expect(catalogueKind("")).toBeNull();
  });
});
