export interface FieldDesk {
  id: string;
  title: string;
  domain: string;
  blurb: string;
  run: string;
  github: string;
}

export const fieldDesks: FieldDesk[] = [
  {
    id: 'vic-ed-flow',
    title: 'ED flow board',
    domain: 'Healthcare ops',
    blurb: 'Ramping and wait across four Victorian campuses. Austin takes the flu week.',
    run: 'python main.py && streamlit run app.py',
    github: 'https://github.com/beastlyluck/vic-ed-flow',
  },
  {
    id: 'rent-pressure-atlas',
    title: 'Rent pressure atlas',
    domain: 'Housing',
    blurb: 'SA2 stress against a 30% income rule. Open site/index.html after the run.',
    run: 'python main.py',
    github: 'https://github.com/beastlyluck/rent-pressure-atlas',
  },
  {
    id: 'vic-grid-peak',
    title: 'VIC grid peak',
    domain: 'Energy',
    blurb: 'Demand q90 and three named price events on a VIC1-shaped clock.',
    run: 'python main.py && uvicorn app:app --reload',
    github: 'https://github.com/beastlyluck/vic-grid-peak',
  },
  {
    id: 'invoice-leak-desk',
    title: 'Invoice leak desk',
    domain: 'Finance ops',
    blurb: 'Duplicate and split AP payments. Hold or release writes the audit file.',
    run: 'python main.py && flask --app app run',
    github: 'https://github.com/beastlyluck/invoice-leak-desk',
  },
];
