# -*- coding: utf-8 -*-
"""Generate completed Excel files for Project 8 Power Query homework."""
import os
import re
import shutil
from pathlib import Path

import pandas as pd

DESKTOP = Path(os.environ["USERPROFILE"]) / "OneDrive" / "Desktop"
PROJECT = next(p for p in DESKTOP.iterdir() if "12" in p.name and "Power" in p.name)
INNER = next(p for p in PROJECT.iterdir() if p.is_dir())
RAW = INNER / "原始素材"
OUT = INNER / "作业完成"

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()


def build_all():
    # 1. 学生成绩：清洗后生成链接表
    src = RAW / "学生成绩.xlsx"
    original = pd.read_excel(src, sheet_name="Sheet1")
    cleaned = original.copy()
    cleaned["学生学号"] = cleaned["学生学号"].astype(str).str.replace(r"\.0$", "", regex=True)
    cleaned = cleaned.drop_duplicates(subset=["学生学号"], keep="first")
    path = OUT / "学生成绩.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        original.to_excel(w, sheet_name="Sheet1", index=False)
        cleaned.to_excel(w, sheet_name="链接表", index=False)

    # 2. 二维表转一维：逆透视
    src = RAW / "二维表转一维.xlsx"
    df = pd.read_excel(src, sheet_name="Sheet1")
    id_col = df.columns[0]
    month_cols = [c for c in df.columns if c != id_col]
    unpivoted = df.melt(id_vars=[id_col], value_vars=month_cols, var_name="月份", value_name="销售额")
    unpivoted = unpivoted.rename(columns={id_col: "产品类别"})
    path = OUT / "二维表转一维.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Sheet1", index=False)
        unpivoted.to_excel(w, sheet_name="逆透视结果", index=False)

    # 3. 多表合并：追加三张工作表
    src = RAW / "多表合并 -字段不同.xlsx"
    xl = pd.ExcelFile(src)
    frames = [pd.read_excel(src, sheet_name=s) for s in xl.sheet_names]
    appended = pd.concat(frames, ignore_index=True, sort=False)
    path = OUT / "多表合并 -字段不同.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        for s in xl.sheet_names:
            pd.read_excel(src, sheet_name=s).to_excel(w, sheet_name=s, index=False)
        appended.to_excel(w, sheet_name="追加合并", index=False)

    # 4. 数据整合与分析：文件夹合并 + 合并查询
    folder = RAW / "从文件夹合并多个Excel（单张工作表）" / "下半年数据"
    months = ["7月", "8月", "9月", "10月", "11月", "12月"]
    sales_parts = []
    for m in months:
        part = pd.read_excel(folder / f"{m}.xlsx", sheet_name="Sheet1")
        part["月份"] = m
        sales_parts.append(part)
    sales = pd.concat(sales_parts, ignore_index=True)
    sales["销售日期"] = pd.to_datetime(sales["销售日期"])

    base = RAW / "从文件夹合并多个Excel（单张工作表）" / "数据整合与分析.xlsx"
    employees = pd.read_excel(base, sheet_name="员工")
    products = pd.read_excel(base, sheet_name="商品")
    merged = sales.merge(employees, on="员工编号", how="left")
    merged = merged.merge(products, on="商品编码", how="left")
    qty_col = [c for c in merged.columns if "销售数量" in str(c)][0]
    merged["销售金额"] = merged[qty_col] * merged["单价"]

    path = OUT / "数据整合与分析.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        sales.to_excel(w, sheet_name="销售数据", index=False)
        employees.to_excel(w, sheet_name="员工", index=False)
        products.to_excel(w, sheet_name="商品", index=False)
        merged.to_excel(w, sheet_name="销售分析", index=False)

    # 5. 多条件查询合并：匹配折扣
    src = RAW / "多条件查询合并.xlsx"
    raw = pd.read_excel(src, sheet_name="数据源", header=None)
    orders = raw.iloc[1:16, :5].copy()
    orders.columns = ["订单编号", "客户名称", "区域", "产品分类", "金额"]
    orders = orders.dropna(subset=["订单编号"])
    discounts = raw.iloc[1:, 8:11].copy()
    discounts.columns = ["区域", "产品组", "折扣"]
    discounts = discounts.dropna(subset=["区域"])
    result = orders.merge(
        discounts, left_on=["区域", "产品分类"], right_on=["区域", "产品组"], how="left"
    ).drop(columns=["产品组"])

    path = OUT / "多条件查询合并.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        pd.read_excel(src, sheet_name="数据源").to_excel(w, sheet_name="数据源", index=False)
        result.to_excel(w, sheet_name="合并结果", index=False)

    # 6. 空气质量：A列转二维表
    src = RAW / "空气质量.xlsx"
    aq = pd.read_excel(src, sheet_name="Sheet1", header=None)
    labels = ["AQI指数", "pm2.5", "pm10", "Co", "No2", "So2", "质量状况"]
    records = []
    i = 8
    while i < len(aq):
        date = aq.iloc[i, 0]
        if pd.isna(date):
            break
        rec = {"日期": pd.to_datetime(date)}
        for j, lab in enumerate(labels):
            rec[lab] = aq.iloc[i + 1 + j, 0]
        records.append(rec)
        i += 8
    air_table = pd.DataFrame(records)
    for col in ["AQI指数", "pm2.5", "pm10", "Co", "No2", "So2"]:
        air_table[col] = pd.to_numeric(air_table[col], errors="coerce")
    air_table["日期"] = air_table["日期"].dt.strftime("%Y-%m-%d")

    path = OUT / "空气质量.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        pd.read_excel(src, sheet_name="Sheet1", header=None).to_excel(
            w, sheet_name="Sheet1", index=False, header=False
        )
        air_table.to_excel(w, sheet_name="二维表", index=False)

    # 7. 拓展训练1：2015-2018汇总
    ext1 = RAW / "拓展训练1 素材"
    parts = []
    for year_file in sorted(ext1.glob("*.xlsx")):
        year = re.search(r"(\d{4})", year_file.stem).group(1)
        for sheet in pd.ExcelFile(year_file).sheet_names:
            part = pd.read_excel(year_file, sheet_name=sheet)
            part["年份"] = year
            part["月份"] = sheet
            parts.append(part)
    summary = pd.concat(parts, ignore_index=True)
    summary.to_excel(OUT / "拓展训练1_销售汇总.xlsx", sheet_name="销售汇总", index=False)

    # 8. 拓展训练2：多行属性合并
    src = RAW / "拓展训练2 素材" / "多行属性合并.xlsx"
    df = pd.read_excel(src, sheet_name="Sheet1")[["区域", "销售代表", "汇总金额"]].dropna()
    grouped = df.groupby("区域", as_index=False).agg(
        销售代表=("销售代表", lambda x: "\\".join(x.astype(str))),
        金额=("汇总金额", "sum"),
    )
    grouped["金额"] = grouped["金额"].round(4)
    path = OUT / "多行属性合并.xlsx"
    with pd.ExcelWriter(path, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="原始数据", index=False)
        grouped.to_excel(w, sheet_name="合并结果", index=False)


def main():
    build_all()
    print(f"已生成 {len(list(OUT.glob('*.xlsx')))} 个 Excel 文件：")
    for f in sorted(OUT.glob("*.xlsx")):
        xl = pd.ExcelFile(f)
        print(f"  {f.name}  →  {xl.sheet_names}")


if __name__ == "__main__":
    main()
