"""Build an ATS-friendly resume PDF for Atharva Jitendra Khaire.

Single column, Helvetica, no tables/images/headers. Contact, LinkedIn,
portfolio, GitHub, skills, and projects are all selectable text.
"""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "public" / "resume" / "Atharva-Khaire-Resume.pdf"

# Keywords typical of AU Data Scientist / Analyst / Engineer JDs.
ATS_KEYWORDS = [
    "data scientist",
    "data analyst",
    "data engineer",
    "python",
    "sql",
    "pandas",
    "numpy",
    "scikit-learn",
    "machine learning",
    "statistical",
    "data analysis",
    "data visualization",
    "tableau",
    "power bi",
    "etl",
    "data pipeline",
    "spark",
    "pyspark",
    "aws",
    "docker",
    "git",
    "dashboard",
    "forecasting",
    "time series",
    "feature engineering",
    "model evaluation",
    "regression",
    "classification",
    "clustering",
    "api",
    "fastapi",
    "pytorch",
    "nlp",
    "computer vision",
    "agile",
    "stakeholder",
    "kpi",
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
    "ci/cd",
    "github",
    "linkedin",
    "monash",
]


class ResumePDF(FPDF):
    def __init__(self) -> None:
        super().__init__(format="A4", unit="mm")
        self.set_margins(16, 12, 16)
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
        self.ln(2.2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(20, 20, 20)
        self.cell(0, 6, title.upper(), new_x="LMARGIN", new_y="NEXT")
        y = self.get_y()
        self.set_draw_color(30, 30, 30)
        self.set_line_width(0.35)
        self.line(16, y, 194, y)
        self.ln(1.6)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(25, 25, 25)

    def para(self, text: str, size: float = 10, leading: float = 4.4) -> None:
        self.set_font("Helvetica", "", size)
        self.multi_cell(0, leading, text)
        self.ln(0.4)

    def job_head(self, left: str, right: str) -> None:
        self.set_font("Helvetica", "B", 10)
        self.cell(130, 4.6, left, new_x="RIGHT", new_y="TOP")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 4.6, right, align="R", new_x="LMARGIN", new_y="NEXT")

    def job_sub(self, text: str) -> None:
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(50, 50, 50)
        self.cell(0, 4.2, text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(25, 25, 25)

    def bullet(self, text: str) -> None:
        self.set_font("Helvetica", "", 9.5)
        x = self.l_margin
        self.set_x(x)
        self.cell(4, 4.15, "-")
        self.multi_cell(0, 4.15, text)
        self.ln(0.15)

    def skill_row(self, label: str, body: str) -> None:
        self.set_font("Helvetica", "B", 9.5)
        self.write(4.15, f"{label}: ")
        self.set_font("Helvetica", "", 9.5)
        self.multi_cell(0, 4.15, body)
        self.ln(0.2)


def build() -> Path:
    pdf = ResumePDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 8, "ATHARVA JITENDRA KHAIRE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(
        0,
        5.5,
        "Data Scientist  |  Data Analyst  |  Data Engineer",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(
        0,
        4.4,
        "Melbourne, VIC, Australia  |  +61 468 948 068  |  atharvakhaire64@gmail.com",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 4.4, "Portfolio:  https://deepsix-pi.vercel.app", align="C", new_x="LMARGIN", new_y="NEXT", link="https://deepsix-pi.vercel.app")
    pdf.cell(
        0,
        4.4,
        "LinkedIn:  https://www.linkedin.com/in/atharva-khaire-497119156",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
        link="https://www.linkedin.com/in/atharva-khaire-497119156",
    )
    pdf.cell(
        0,
        4.4,
        "GitHub:  https://github.com/beastlyluck",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
        link="https://github.com/beastlyluck",
    )

    pdf.section("Professional Summary")
    pdf.para(
        "Master of Data Science candidate at Monash University seeking a Data Scientist, "
        "Data Analyst, or Data Engineer role. Builds end-to-end analytics: data wrangling, "
        "SQL, statistical modelling, machine learning, time series forecasting, causal inference, "
        "ETL data pipelines, and interactive dashboards. Portfolio of six digital twins and "
        "22 analytics case studies using Python, Pandas, NumPy, scikit-learn, PySpark, PyTorch, "
        "Tableau, FastAPI, Docker, and AWS. Focused on data quality, feature engineering, "
        "model evaluation, SHAP explainability, KPI reporting, and numbers stakeholders can audit."
    )

    pdf.section("Technical Skills")
    pdf.skill_row(
        "Programming",
        "Python, SQL, R, Java, C++, JavaScript, TypeScript, Linux shell, Git, GitHub, CI/CD (GitHub Actions)",
    )
    pdf.skill_row(
        "Data analysis",
        "Pandas, NumPy, data wrangling, exploratory data analysis (EDA), statistical modelling, "
        "hypothesis testing, A/B testing, causal inference, time series forecasting, feature engineering, "
        "model evaluation, data quality",
    )
    pdf.skill_row(
        "Machine learning",
        "scikit-learn, XGBoost, LightGBM, supervised learning, classification, regression, clustering, "
        "anomaly detection, SHAP, model monitoring, drift detection, PyTorch, computer vision, NLP",
    )
    pdf.skill_row(
        "Data engineering",
        "ETL, data pipelines, Apache Spark / PySpark, dbt-style modelling, Great Expectations, "
        "Parquet, PostgreSQL, FastAPI, REST APIs, Docker, Kubernetes, AWS, Kafka / Avro",
    )
    pdf.skill_row(
        "Visualization and BI",
        "Tableau, Power BI, Plotly, Matplotlib, ggplot2, Streamlit, dashboard design, KPI reporting, GeoPandas",
    )
    pdf.skill_row(
        "Working style",
        "Agile delivery, stakeholder communication, project management, documentation, code review",
    )

    pdf.section("Selected Projects")
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.cell(0, 4, "Portfolio: https://deepsix-pi.vercel.app   |   Source: https://github.com/beastlyluck", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(0.6)

    projects = [
        (
            "AeroTwin  -  Digital twin (aerospace)  |  Python, PyTorch, TorchScript",
            "Trained a drone control policy in simulation, then scored sim-to-real gap on held-out wind. "
            "Six airframes, 400 Hz edge loop, domain randomisation vs a held-out world. GitHub: github.com/beastlyluck/aerotwin",
        ),
        (
            "GridPulse  -  Digital twin (energy)  |  Python, SciPy, HiGHS, SQL-style streaming",
            "Built a 48-bus microgrid twin: DC power flow, physics-informed line rating, and LP dispatch "
            "so one overloaded line does not cascade. Compared nameplate vs derated schedules. github.com/beastlyluck/gridpulse",
        ),
        (
            "BioSync  -  Digital twin (wearables)  |  Python, NumPy, ONNX, Streamlit",
            "Continuous-time glucose and heart-rate replica that keeps running when the wearable drops out. "
            "RK4 ODE, missingness masks, on-device ONNX runtime, differential-privacy cohort export. github.com/beastlyluck/biosync",
        ),
        (
            "OceanicOS  -  Digital twin (logistics)  |  Python, NetworkX, FastAPI",
            "Discrete-event container terminal: 2 berths, 16 AGVs, Hungarian assignment, 48-hour policy comparison "
            "so the yard does not jam. Hierarchical volume forecasts reconciled with MinT. github.com/beastlyluck/oceanicos",
        ),
        (
            "ForgeX  -  Digital twin (manufacturing)  |  Python, OpenCV, scikit-learn",
            "Late-fusion cell twin: acoustics, current, and vision. IsolationForest plus logistic score, HOLD/ESTOP "
            "interlock that will not self-reset. Scored on a later shift than the fit set. github.com/beastlyluck/forgex",
        ),
        (
            "TerraTwin  -  Digital twin (agriculture)  |  Python, NumPy, Docker, Kubernetes",
            "Closed-loop climate for an 8-tower vertical farm. Fitted Q-iteration vs PID on the same seed; "
            "spatial disease model; facility.toml as the config contract. github.com/beastlyluck/terratwin",
        ),
        (
            "Campus load forecast and model watch desk  |  Python, LightGBM, time series, drift monitoring",
            "Hourly electricity demand for 12 buildings: LightGBM + LSTM residual, rolling-origin evaluation, "
            "24-hour MAPE 6.8%. PSI / Evidently drift gate so a winter model cannot silently fail in a heatwave.",
        ),
        (
            "Nightly analytics fabric and score API  |  Python, dbt, Great Expectations, FastAPI, XGBoost, SHAP",
            "ETL pipeline: 27 dbt-style models, 42 data-quality tests, 18-minute nightly SLA; failed tests block publish. "
            "Credit-style score API: 12 features, AUC 0.86, p95 latency 11 ms, top-3 SHAP reason codes, canary rollback.",
        ),
        (
            "Causal inference and forecasting cases  |  Python, R, SQL, Tableau",
            "Retention uplift (Qini 0.19 at 20% targeting, 34% budget saved at equal retention). Fare synthetic control "
            "(ATT -6.4% boardings, placebo tests). SKU hierarchy MinT (WRMSSE 0.62, 12k SKUs, coherence error 0). "
            "Ward occupancy twin: MAE 4.2 beds, 83% interval coverage.",
        ),
        (
            "Computer vision, graphs, and operations boards  |  Python, PyTorch, YOLOv8, NetworkX, Tableau",
            "EuroSAT land-use change: 97.4% accuracy, unsure tiles reported. Inspection KPI board: mAP 0.69, PPM -18%. "
            "Fraud-ring case packs: PR-AUC 0.64, review time -31%. Victorian ED wait board, rent-stress atlas, invoice-leak queue.",
        ),
    ]

    for title, body in projects:
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.multi_cell(0, 4.15, title)
        pdf.bullet(body)

    pdf.section("Experience")
    pdf.job_head("Data Science Project Contributor  -  Mylan Laboratories", "May 2022 - Jul 2022")
    pdf.job_sub("Nashik, India  |  Manufacturing analytics")
    pdf.bullet(
        "Built a production-line dashboard for manufacturing insights using Python, Pandas, and data visualization."
    )
    pdf.bullet(
        "Analysed system efficiency metrics and presented findings to a cross-functional team for data-driven decisions."
    )

    pdf.job_head("Assistant Manager  -  ERTH Electric Pvt. Ltd.", "Jun 2023 - Mar 2024")
    pdf.job_sub("Nashik, India  |  Full-time  |  Web, content, and project delivery")
    pdf.bullet(
        "Managed the content and video pipeline for web and social channels; contributed to a successful website launch."
    )
    pdf.bullet(
        "Project-managed mobile application delivery and implemented frontend (HTML, CSS, JavaScript) with backend compatibility checks."
    )

    pdf.job_head("Volunteer  -  Swapnapurti Foundation", "2020 - 2024")
    pdf.job_sub("Nashik, India  |  Community outreach")
    pdf.bullet(
        "Ran technology workshops for students in remote village schools and supported community clean-up and outreach events."
    )

    pdf.section("Education")
    pdf.job_head("Master of Data Science  -  Monash University", "2024 - 2026")
    pdf.job_sub("Clayton, Melbourne, Australia  |  Coursework complete; FIT5122 and FIT5120 in progress")
    pdf.bullet(
        "Units include Python, SQL / databases, data wrangling, statistical modelling, machine learning, "
        "PySpark / big data, Tableau and data visualisation, deep learning (PyTorch), cloud computing and security (AWS, Docker, Kubernetes), "
        "project management, and IT research methods."
    )
    pdf.bullet(
        "Industry experience studio project (FIT5120) and professional practice (FIT5122) in progress. Agile delivery with an external client."
    )

    pdf.job_head("Bachelor of Computer Science  -  Savitribai Phule Pune University", "Graduated Jan 2024")
    pdf.job_sub("Pune, India")
    pdf.bullet(
        "Capstone: historical figures in a virtual environment using Unreal Engine 5, C++, and AI behaviour systems."
    )

    pdf.section("Certifications")
    pdf.bullet("Learning Python for Data Analysis and Visualization  -  Udemy  (Jun 2022)  |  Jupyter, NumPy, Pandas, Matplotlib")
    pdf.bullet("Complete Blender Creator: 3D Modelling for Beginners  -  Udemy  (Feb 2024)")
    pdf.bullet("Unreal Engine 5 C++ Developer  -  Udemy  (Feb 2024)")

    pdf.section("Additional Information")
    pdf.para(
        "Languages: English, Hindi, Marathi. Open to Data Scientist, Data Analyst, and Data Engineer roles in Melbourne. "
        "Portfolio website: https://deepsix-pi.vercel.app  |  LinkedIn: https://www.linkedin.com/in/atharva-khaire-497119156",
        size=9.5,
        leading=4.2,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    return OUT


def ats_score(pdf_path: Path) -> tuple[float, list[str], list[str]]:
    import fitz

    doc = fitz.open(pdf_path)
    text = "\n".join(page.get_text() for page in doc).lower()
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
    print(f"Pages and ATS keyword coverage: {score:.1f}%  ({len(hit)}/{len(ATS_KEYWORDS)})")
    if miss:
        print("Missing:", ", ".join(miss))
    import fitz

    doc = fitz.open(path)
    print(f"Pages: {doc.page_count}")
    print("--- extract page 1 head ---")
    print(doc[0].get_text()[:900])
