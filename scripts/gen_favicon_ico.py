"""生成项目根目录 favicon.ico（PNG 嵌入 ICO，无第三方依赖）。"""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
W = H = 32
# 品牌青底 #0d9488 + 简单白色椭圆（大脑意象）
TEAL = bytes([13, 148, 136, 255])
WHITE = bytes([255, 255, 255, 255])


def pixel(x: int, y: int) -> bytes:
    cx, cy = W // 2, H // 2 + 1
    if ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 < 7:
        return WHITE
    return TEAL


def build_png_rgba() -> bytes:
    raw = b""
    for y in range(H):
        raw += b"\x00"
        for x in range(W):
            raw += pixel(x, y)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)
    compressed = zlib.compress(raw, level=9)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )
    return png


def build_ico(png_bytes: bytes) -> bytes:
    # ICONDIR + single entry pointing at PNG payload
    icondir = struct.pack("<HHH", 0, 1, 1)
    # bWidth/bHeight: 0 means 256 for ICO; use actual for <256
    entry = struct.pack(
        "<BBBBHHII",
        W if W < 256 else 0,
        H if H < 256 else 0,
        0,
        0,
        1,
        32,
        len(png_bytes),
        6 + 16,
    )
    return icondir + entry + png_bytes


def main() -> None:
    png = build_png_rgba()
    ico = build_ico(png)
    out = ROOT / "favicon.ico"
    out.write_bytes(ico)
    print("written", out, len(ico), "bytes")


if __name__ == "__main__":
    main()
