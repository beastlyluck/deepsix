"""Build an ATS-friendly resume PDF for Atharva Jitendra Khaire.

Single column, Helvetica, no tables/images/headers. Standard headings,
reverse-chronological work history, spelled-out keywords, and the
Bachelor of Engineering (Computer Science) degree.
"""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "public" / "resume" / "Atharva-Khaire-Resume.pdf"

# Composite of AU Data Scientist / Data Analyst / Data Engineer job ads.
ATS_KEYWORDS = [
    "data scientist",
    "data analyst",
    "data engineer",
    "bachelor of engineering",
    "computer science",
    "python",
    "sql",
    "pandas",
    "numpy",
    "scikit-learn",
    "machine learning",
    "deep learning",
    "statistical",
    "statistics",
    "data analysis",
    "data analytics",
    "data visualization",
    "data visualisation",
    "tableau",
    "power bi",
    "microsoft excel",
    "etl",
    "extract, transform, load",
    "data pipeline",
    "data modelling",
    "data modeling",
    "data cleaning",
    "data mining",
    "spark",
    "pyspark",
    "aws",
    "docker",
    "git",
    "dashboard",
    "forecasting",
    "predictive",
    "time series",
    "feature engineering",
    "model evaluation",
    "cross-validation",
    "regression",
    "classification",
    "clustering",
    "random forest",
    "api",
    "fastapi",
    "pytorch",
    "natural language processing",
    "computer vision",
    "agile",
    "stakeholder",
    "kpi",
    "key performance indicator",
    "data quality",
    "a/b testing",
    "causal inference",
    "xgboost",
    "lightgbm",
    "dbt",
    "kubernetes",
    "streamlit",
    "shap",
    "exploratory data analysis",
    "postgresql",
    "data wrangling",
    "jupyter",
    "business intelligence",
    "reporting",
    "cloud",
    "big data",
    "communication",
    "teamwork",
    "problem solving",
    "ci/cd",
    "github",
    "linkedin",
    "monash",
]


class ResumePDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="A4", unit="mm")
        self.set_margins(15, 11, 15)
        self.set_auto_page_break(auto=True, margin=12)
        self.set_title("Atharva Jitendra Khaire - Resume")
        self.set_author("Atharva Jitendra Khaire")
        self.set_creator("DEEPSIX")
        self.set_lang("en")

    def header(self) -> None:
        return

    def footer(self) -> None:
        return

    def section(self, title: str) -> None:
        self.ln(1.8)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(20, 20, 20)
        self.cell(0, 5.8, title.upper(), new_x="LMARGIN", new_y="NEXT")
        y = self.get_y()
        self.set_draw_color(30, 30, 30)
        self.set_line_width(0.4)
        self.line(15, y, 195, y)
        self.ln(1.4)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(25, 25, 25)

    def para(self, text: str, size: float = 9.5, leading: float = 4.2) -> None:
        self.set_font("Helvetica", "", size)
        self.multi_cell(0, leading, text)
        self.ln(0.3)

    def job_head(self, left: str, right: str) -> None:
        self.set_font("Helvetica", "B", 10)
        width = 178
        right_w = self.get_string_width(right) + 1
        left_w = max(width - right_w, 90)
        self.cell(left_w, 4.5, left, new_x="RIGHT", new_y="TOP")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 4.5, right, align="R", new_x="LMARGIN", new_y="NEXT")

    def job_sub(self, text: str) -> None:
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(50, 50, 50)
        self.cell(0, 4.0, text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(25, 25, 25)

    def bullet(self, text: str) -> None:
        self.set_font("Helvetica", "", 9.3)
        self.set_x(self.l_margin)
        self.cell(4, 4.05, "-")
        self.multi_cell(0, 4.05, text)
        self.ln(0.12)

    def skill_row(self, label: str, body: str) -> None:
        self.set_font("Helvetica", "B", 9.3)
        self.write(4.05, f"{label}: ")
        self.set_font("Helvetica", "", 9.3)
        self.multi_cell(0, 4.05, body)
        self.ln(0.15)


def build() -> Path:
    pdf = ResumePDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 17)
    pdf.cell(0, 7.4, "ATHARVA JITENDRA KHAIRE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(
        0,
        5.2,
        "Data Scientist  |  Data Analyst  |  Data Engineer",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.set_font("Helvetica", "", 8.8)
    pdf.cell(
        0,
        4.1,
        "Melbourne, VIC, Australia  |  +61 468 948 068  |  atharvakhaire64@gmail.com",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.cell(
        0,
        4.1,
        "Portfolio: https://deepsix-pi.vercel.app  |  LinkedIn: https://www.linkedin.com/in/atharva-khaire-497119156",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
        link="https://deepsix-pi.vercel.app",
    )
    pdf.cell(
        0,
        4.1,
        "GitHub: https://github.com/beastlyluck",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
        link="https://github.com/beastlyluck",
    )

    pdf.section("Professional Summary")
    pdf.para(
        "Master of Data Science candidate at Monash University with a Bachelor of Engineering (B.E.) "
        "in Computer Science. Seeking a Data Scientist, Data Analyst, or Data Engineer role in Melbourne. "
        "Builds end-to-end data analytics: data cleaning, data wrangling, SQL, statistical analysis, "
        "machine learning, predictive modelling, time series forecasting, A/B testing, causal inference, "
        "Extract Transform Load (ETL) data pipelines, and business intelligence dashboards. Portfolio of "
        "six digital twins and 22 analytics case studies using Python, Pandas, NumPy, scikit-learn, "
        "PySpark, PyTorch, Jupyter, Microsoft Excel, Tableau, Microsoft Power BI, FastAPI, Docker, and AWS. "
        "Strong problem solving, stakeholder communication, teamwork, and KPI reporting. Focused on data "
        "quality, feature engineering, cross-validation, model evaluation, SHAP explainability, and "
        "insights stakeholders can audit."
    )

    pdf.section("Skills")
    pdf.skill_row(
        "Core competencies",
        "Data Science, Data Analysis, Data Analytics, Data Engineering, Machine Learning, Deep Learning, "
        "Statistical Analysis, Predictive Modelling, Data Mining, Business Intelligence, Reporting, Big Data, Cloud",
    )
    pdf.skill_row(
        "Programming",
        "Python, SQL, R, Java, C++, JavaScript, TypeScript, Linux, Git, GitHub, CI/CD (GitHub Actions), Jupyter",
    )
    pdf.skill_row(
        "Data analysis",
        "Pandas, NumPy, data wrangling, data cleaning, exploratory data analysis (EDA), data modelling / data modeling, "
        "statistics, hypothesis testing, A/B testing, causal inference, time series forecasting, feature engineering, "
        "model evaluation, cross-validation, data quality, Microsoft Excel",
    )
    pdf.skill_row(
        "Machine learning",
        "scikit-learn, XGBoost, LightGBM, Random Forest, supervised learning, classification, regression, clustering, "
        "anomaly detection, SHAP, model monitoring, PyTorch, computer vision, Natural Language Processing (NLP)",
    )
    pdf.skill_row(
        "Data engineering",
        "Extract, Transform, Load (ETL), data pipelines, Apache Spark / PySpark, dbt, Great Expectations, Parquet, "
        "PostgreSQL, FastAPI, REST APIs, Docker, Kubernetes, AWS, Kafka",
    )
    pdf.skill_row(
        "Visualization and BI",
        "Tableau, Microsoft Power BI, Plotly, Matplotlib, ggplot2, Streamlit, dashboard design, "
        "Key Performance Indicator (KPI) reporting, GeoPandas",
    )
    pdf.skill_row(
        "Collaboration",
        "Agile delivery, stakeholder communication, teamwork, project management, documentation, code review",
    )

    pdf.section("Education")
    pdf.job_head("Master of Data Science  -  Monash University", "2024 - 2026")
    pdf.job_sub("Clayton, Melbourne, Australia  |  Coursework complete; FIT5122 and FIT5120 in progress")
    pdf.bullet(
        "Core study: Python, SQL and databases, data wrangling, statistical modelling, machine learning, "
        "Apache Spark / PySpark (big data), Tableau and data visualisation, deep learning (PyTorch), "
        "cloud computing and security (AWS, Docker, Kubernetes), project management, IT research methods."
    )
    pdf.bullet(
        "Industry experience studio project (FIT5120) and professional practice (FIT5122) in progress. "
        "Agile delivery, stakeholder communication, and teamwork with an external client."
    )

    pdf.job_head(
        "Bachelor of Engineering (B.E.), Computer Science  -  Savitribai Phule Pune University",
        "Graduated Jan 2024",
    )
    pdf.job_sub("Pune, India  |  Bachelor of Engineering in Computer Science")
    pdf.bullet(
        "Four-year Bachelor of Engineering (Computer Science): programming, data structures, algorithms, "
        "databases, software engineering, and computer networks."
    )
    pdf.bullet(
        "Capstone: virtual-environment reconstruction of historical figures using Unreal Engine 5, C++, and AI behaviour systems."
    )

    pdf.section("Projects")
    pdf.set_font("Helvetica", "I", 8.4)
    pdf.cell(
        0,
        3.8,
        "Portfolio website: https://deepsix-pi.vercel.app   |   GitHub: https://github.com/beastlyluck",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(0.4)

    projects = [
        (
            "AeroTwin  |  Data Scientist  |  Python, PyTorch, machine learning",
            "Built a digital twin that trains a drone control policy in simulation and measures the sim-to-real gap "
            "on held-out wind. Six airframes, 400 Hz loop, cross-validation across seeds. github.com/beastlyluck/aerotwin",
        ),
        (
            "GridPulse  |  Data Analyst / Data Engineer  |  Python, SQL, optimization",
            "Built a 48-bus energy twin: power-flow analytics, physics-informed ratings, and LP dispatch dashboards "
            "so one overloaded line does not cascade. github.com/beastlyluck/gridpulse",
        ),
        (
            "BioSync  |  Data Scientist  |  Python, NumPy, Streamlit",
            "Wearable analytics twin for glucose and heart rate. Data cleaning under missing sensors, predictive "
            "ODE modelling, Jupyter/Streamlit reporting, privacy-preserving cohort export. github.com/beastlyluck/biosync",
        ),
        (
            "OceanicOS  |  Data Engineer  |  Python, FastAPI, forecasting",
            "Discrete-event logistics twin: 2 berths, 16 AGVs, assignment optimization, 48-hour policy comparison, "
            "and hierarchical time series forecasts. REST API replay. github.com/beastlyluck/oceanicos",
        ),
        (
            "ForgeX  |  Data Scientist  |  Python, scikit-learn, computer vision",
            "Manufacturing cell twin: data mining on acoustics, current, and vision. Random Forest / IsolationForest "
            "plus logistic classification, model evaluation on a later shift. github.com/beastlyluck/forgex",
        ),
        (
            "TerraTwin  |  Data Scientist  |  Python, Docker, Kubernetes, cloud",
            "Agriculture climate twin: predictive control vs PID, spatial data analysis, Docker/Kubernetes deployment. "
            "github.com/beastlyluck/terratwin",
        ),
        (
            "Campus load forecast and model monitoring  |  Python, LightGBM, time series",
            "Forecasting and data analytics for hourly electricity demand across 12 buildings. LightGBM + residual "
            "model, rolling-origin evaluation, 24-hour MAPE 6.8%. Drift monitoring so a winter model cannot fail silently.",
        ),
        (
            "Nightly analytics fabric and score API  |  Data Engineer  |  ETL, dbt, FastAPI, XGBoost, SHAP",
            "Extract, Transform, Load (ETL) data pipeline: 27 models, 42 data quality tests, 18-minute nightly SLA. "
            "Credit-style machine learning API: 12 features, AUC 0.86, p95 11 ms, SHAP reason codes, canary rollback.",
        ),
        (
            "Causal inference, forecasting, and BI cases  |  Python, R, SQL, Tableau, Power BI",
            "A/B-style uplift (Qini 0.19, 34% budget saved). Synthetic control ATT -6.4%. SKU forecast hierarchy "
            "WRMSSE 0.62 on 12k SKUs. Ward occupancy MAE 4.2 beds. Tableau / Power BI KPI dashboards.",
        ),
        (
            "Computer vision, graph analytics, and operations reporting  |  PyTorch, YOLOv8, NetworkX",
            "Land-use classification 97.4% accuracy. Inspection KPI board: mAP 0.69, PPM -18%. Fraud-ring case packs: "
            "PR-AUC 0.64, review time -31%. ED wait, rent-stress, and invoice-leak reporting boards.",
        ),
    ]

    for title, body in projects:
        pdf.set_font("Helvetica", "B", 9.3)
        pdf.multi_cell(0, 4.0, title)
        pdf.bullet(body)

    pdf.section("Work Experience")
    pdf.job_head("Assistant Manager  -  ERTH Electric Pvt. Ltd.", "June 2023 - March 2024")
    pdf.job_sub("Nashik, India  |  Full-time  |  Web delivery, reporting, and project management")
    pdf.bullet(
        "Led website launch and content pipeline using HTML, CSS, JavaScript; coordinated stakeholders and Agile-style delivery."
    )
    pdf.bullet(
        "Project-managed mobile application delivery, backend-frontend compatibility checks, and progress reporting to managers."
    )
    pdf.bullet(
        "Used problem solving and communication to keep web, video, and social reporting on schedule."
    )

    pdf.job_head("Data Science Project Contributor  -  Mylan Laboratories", "May 2022 - July 2022")
    pdf.job_sub("Nashik, India  |  Manufacturing analytics  |  Python, Pandas, dashboards")
    pdf.bullet(
        "Built a production-line dashboard for manufacturing insights using Python, Pandas, Microsoft Excel, and data visualization."
    )
    pdf.bullet(
        "Performed data cleaning, exploratory data analysis, and KPI reporting on system efficiency metrics."
    )
    pdf.bullet(
        "Presented data-driven findings to a cross-functional team; supported data-driven decision making on the line."
    )

    pdf.job_head("Volunteer  -  Swapnapurti Foundation", "2020 - 2024")
    pdf.job_sub("Nashik, India  |  Community outreach  |  Leadership, communication, teamwork")
    pdf.bullet(
        "Delivered technology workshops for students in remote village schools; organised community outreach events."
    )

    pdf.section("Certifications")
    pdf.bullet(
        "Learning Python for Data Analysis and Visualization  -  Udemy (June 2022)  |  Jupyter, NumPy, Pandas, Matplotlib, data visualization"
    )
    pdf.bullet("Complete Blender Creator: 3D Modelling for Beginners  -  Udemy (February 2024)")
    pdf.bullet("Unreal Engine 5 C++ Developer  -  Udemy (February 2024)")

    pdf.section("Additional Information")
    pdf.para(
        "Languages: English, Hindi, Marathi. Open to Data Scientist, Data Analyst, and Data Engineer roles in Melbourne. "
        "Bachelor of Engineering (Computer Science) plus Master of Data Science. "
        "Portfolio: https://deepsix-pi.vercel.app  |  LinkedIn: https://www.linkedin.com/in/atharva-khaire-497119156  |  "
        "GitHub: https://github.com/beastlyluck",
        size=9.2,
        leading=4.05,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    return OUT


def ats_score(pdf_path: Path) -> tuple[float, list[str], list[str]]:
    import fitz
    import re

    doc = fitz.open(pdf_path)
    text = re.sub(r"\s+", " ", "\n".join(page.get_text() for page in doc)).lower()
    hit, miss = [], []
    for kw in ATS_KEYWORDS:
        if kw.lower() in text:
            hit.append(kw)
        else:
            miss.append(kw)
    score = 100.0 * len(hit) / len(ATS_KEYWORDS)
    return score, hit, miss


if __name__ == "__main__":
    path = build()
    score, hit, miss = ats_score(path)
    print(f"Wrote {path}")
    print(f"ATS keyword coverage: {score:.1f}%  ({len(hit)}/{len(ATS_KEYWORDS)})")
    if miss:
        print("Missing:", ", ".join(miss))
    import fitz

    doc = fitz.open(path)
    print(f"Pages: {doc.page_count}")
    print("--- page 1 ---")
    print(doc[0].get_text()[:1200])
    if doc.page_count > 1:
        print("--- page 2 tail ---")
        print(doc[1].get_text()[-800:])
