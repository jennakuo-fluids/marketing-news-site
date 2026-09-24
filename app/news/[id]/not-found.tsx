import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap detail">
      <p className="empty">找不到這筆新聞。</p>
      <p style={{ textAlign: "center" }}>
        <Link href="/search">回到搜尋結果</Link>
      </p>
    </div>
  );
}
