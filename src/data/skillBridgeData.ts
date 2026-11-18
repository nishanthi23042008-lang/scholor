export type EducationLevel = '1st PUC' | '2nd PUC' | 'Engineering' | 'Degree';

export interface EngineeringBranchInfo {
  code: string;
  name: string;
  category:
    | 'Computing & AI'
    | 'Electronics & Electrical'
    | 'Mechanical & Mobility'
    | 'Infrastructure & Aerospace'
    | 'Chemical, Bio & Materials';
  subjects: string[];
  skills: string[];
  activities: string[];
  future: string[];
}

export interface RoadmapData {
  subjects: string[];
  skills: string[];
  activities: string[];
  future: string[];
}

export interface MockQuestion {
  id: string;
  branchKey: string;
  topic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const ENGINEERING_BRANCHES: EngineeringBranchInfo[] = [
  {
    code: 'CSE',
    name: 'Computer Science & Engineering (CSE)',
    category: 'Computing & AI',
    subjects: [
      'Data Structures & Algorithms',
      'Operating Systems & Computer Architecture',
      'Database Management Systems (SQL/NoSQL)',
      'Computer Networks & Software Engineering',
    ],
    skills: [
      'C / C++, Python, Java & TypeScript',
      'Full-stack web engineering & Git workflows',
      'System design & problem-solving patterns',
      'Technical documentation & teamwork',
    ],
    activities: [
      'Solve 3–5 DSA problems daily and analyze time complexity',
      'Build a full-stack capstone project with REST APIs & SQL database',
      'Contribute to GDG on Campus coding sprints or open-source repos',
    ],
    future: [
      'Software Development Engineer',
      'Backend / Full-Stack Architect',
      'Cloud & Distributed Systems Engineer',
      'M.Tech / MS in Computer Science',
    ],
  },
  {
    code: 'ISE',
    name: 'Information Science & Engineering (ISE)',
    category: 'Computing & AI',
    subjects: [
      'Data Structures & Web Technologies',
      'Information Retrieval & Cloud Computing',
      'Software Testing & Quality Assurance',
      'Enterprise Database Systems & Agile DevOps',
    ],
    skills: [
      'API architecture & microservices',
      'UI/UX engineering & accessibility',
      'Automated testing & CI/CD pipelines',
      'Agile product planning',
    ],
    activities: [
      'Deploy a cloud-hosted web application with automated tests',
      'Design normalized relational schemas and query tuning exercises',
      'Participate in campus hackathons and product showcases',
    ],
    future: [
      'Full-Stack Application Developer',
      'Cloud & DevOps Engineer',
      'Solutions Architect',
      'Product Management / MBA',
    ],
  },
  {
    code: 'AIML',
    name: 'Artificial Intelligence & Machine Learning (AI & ML)',
    category: 'Computing & AI',
    subjects: [
      'Linear Algebra, Probability & Optimization',
      'Machine Learning & Pattern Recognition',
      'Deep Learning, Neural Networks & NLP',
      'Computer Vision & Reinforcement Learning',
    ],
    skills: [
      'Python, NumPy, Pandas, PyTorch & Scikit-learn',
      'Model evaluation, bias-variance tuning & MLOps',
      'Prompt grounding & RAG architectures',
      'Experiment tracking & reproducible pipelines',
    ],
    activities: [
      'Implement linear regression and neural nets from scratch in NumPy',
      'Train and evaluate an image classifier or NLP text analyzer',
      'Reproduce a research paper baseline on a clean dataset',
    ],
    future: [
      'Machine Learning Engineer',
      'Applied AI Scientist',
      'MLOps Platform Engineer',
      'Research Postgraduate Studies',
    ],
  },
  {
    code: 'DS',
    name: 'Data Science & Engineering (DS)',
    category: 'Computing & AI',
    subjects: [
      'Statistical Inference & Hypothesis Testing',
      'Data Warehousing & Big Data Engineering',
      'Predictive Modeling & Time-Series Analysis',
      'Data Visualization & Business Analytics',
    ],
    skills: [
      'SQL window functions & ETL pipelines',
      'Python / R exploratory data analysis',
      'Apache Spark & streaming ingestion basics',
      'Executive storytelling with clean charts',
    ],
    activities: [
      'Clean a messy public dataset and publish reproducible notebooks',
      'Build an interactive metrics dashboard using real public data',
      'Practice A/B testing case studies and statistical validation',
    ],
    future: [
      'Data Scientist',
      'Data & Analytics Engineer',
      'Quantitative Analyst',
      'Business Intelligence Lead',
    ],
  },
  {
    code: 'CSB',
    name: 'Cyber Security & Blockchain (CSB)',
    category: 'Computing & AI',
    subjects: [
      'Applied Cryptography & Number Theory',
      'Network Security, Firewalls & Intrusion Detection',
      'Web Application Security (OWASP Top 10)',
      'Digital Forensics & Distributed Ledgers',
    ],
    skills: [
      'Linux internals, packet capture (Wireshark) & Bash',
      'Vulnerability assessment & secure code review',
      'Smart contract auditing & key management',
      'Incident response & threat modeling',
    ],
    activities: [
      'Practice ethical Capture-The-Flag (CTF) web & crypto challenges',
      'Audit sample web endpoints for SSRF, XSS, and SQL injection',
      'Configure TLS certificates and harden a Linux sandbox server',
    ],
    future: [
      'Security Operations (SOC) Analyst',
      'Application Security Engineer',
      'Penetration Tester / Ethical Hacker',
      'Blockchain Security Auditor',
    ],
  },
  {
    code: 'ECE',
    name: 'Electronics & Communication Engineering (ECE)',
    category: 'Electronics & Electrical',
    subjects: [
      'Analog & Digital Electronic Circuits',
      'Signals, Systems & Digital Signal Processing',
      'Microcontrollers, VLSI & Embedded Systems',
      'Communication Systems & Antennas / RF',
    ],
    skills: [
      'Verilog / VHDL & FPGA digital design',
      'Embedded C / RTOS on ARM Cortex & ESP32',
      'PCB layout (KiCad) & SPICE circuit simulation',
      'Oscilloscope & logic analyzer debugging',
    ],
    activities: [
      'Design and simulate a digital filter or UART controller in Verilog',
      'Build an IoT sensor node with low-power sleep scheduling',
      'Design a 2-layer PCB schematic and verify signal integrity',
    ],
    future: [
      'VLSI Design & Verification Engineer',
      'Embedded Firmware Engineer',
      'RF / Telecom Systems Engineer',
      'Semiconductor Hardware Architect',
    ],
  },
  {
    code: 'EEE',
    name: 'Electrical & Electronics Engineering (EEE)',
    category: 'Electronics & Electrical',
    subjects: [
      'Network Analysis & Electromagnetic Fields',
      'Electrical Machines (Transformers, Induction & Synchronous)',
      'Power Systems & High-Voltage Engineering',
      'Power Electronics, Drives & Control Systems',
    ],
    skills: [
      'MATLAB / Simulink power system modeling',
      'PLC & SCADA industrial automation',
      'EV motor drive & inverter circuit design',
      'Fault analysis & protective relaying',
    ],
    activities: [
      'Simulate a buck/boost DC-DC converter and analyze ripple',
      'Model a three-phase load flow network in Simulink',
      'Build a PID speed controller for a DC/BLDC motor setup',
    ],
    future: [
      'Power Grid & Renewable Energy Engineer',
      'EV Powertrain & Battery Systems Engineer',
      'Industrial Automation & Control Engineer',
      'Core PSU & GATE Career Tracks',
    ],
  },
  {
    code: 'ICE',
    name: 'Instrumentation & Control Engineering (ICE)',
    category: 'Electronics & Electrical',
    subjects: [
      'Sensors, Transducers & Signal Conditioning',
      'Control Systems Engineering (PID & State-Space)',
      'Industrial Process Instrumentation & DCS',
      'Biomedical & Analytical Instrumentation',
    ],
    skills: [
      'Calibration & error uncertainty analysis',
      'PLC ladder logic & HMI panel programming',
      'LabVIEW / MATLAB frequency-response tuning',
      'IIoT telemetry integration',
    ],
    activities: [
      'Design a Wheatstone bridge amplifier for a strain-gauge or RTD',
      'Tune PID loop parameters against step disturbances in simulation',
      'Document P&ID instrumentation diagrams for a sample process plant',
    ],
    future: [
      'Process Control Engineer',
      'Automation & SCADA Specialist',
      'Aerospace Flight-Test Instrumentation Engineer',
      'Medical Device Test Engineer',
    ],
  },
  {
    code: 'ME',
    name: 'Mechanical Engineering (ME)',
    category: 'Mechanical & Mobility',
    subjects: [
      'Engineering Thermodynamics & Heat Transfer',
      'Fluid Mechanics & Hydraulic Machinery',
      'Strength of Materials & Theory of Machines',
      'Manufacturing Processes, CAD/CAM & Finite Element Analysis',
    ],
    skills: [
      '3D parametric CAD (SolidWorks / Fusion 360 / Creo)',
      'FEA stress & thermal simulation (ANSYS)',
      'GD&T engineering drawings & CNC toolpaths',
      'Root-cause failure analysis',
    ],
    activities: [
      'Model a multi-part gear assembly with tolerance stack-up analysis',
      'Perform cantilever and truss FEA validation against hand calculations',
      'Fabricate a prototype via 3D printing or workshop machining',
    ],
    future: [
      'Mechanical Design & CAE Engineer',
      'Thermal & HVAC Systems Engineer',
      'Manufacturing & Quality Engineer',
      'Automotive / Aerospace R&D',
    ],
  },
  {
    code: 'AU',
    name: 'Automobile Engineering (AU)',
    category: 'Mechanical & Mobility',
    subjects: [
      'Automotive Chassis, Suspension & Braking Systems',
      'Internal Combustion Engines & Hybrid/EV Powertrains',
      'Vehicle Dynamics & Aerodynamics',
      'Automotive Electronics, CAN Bus & Diagnostics',
    ],
    skills: [
      'Battery pack thermal & BMS fundamentals',
      'CAN / OBD-II telemetry decoding',
      'Suspension kinematics modeling',
      'NVH & safety compliance standards',
    ],
    activities: [
      'Analyze traction force and gear ratios for an electric two-wheeler',
      'Design a double-wishbone suspension CAD mockup',
      'Join SAE BAJA / Formula Student technical teams',
    ],
    future: [
      'EV Powertrain Engineer',
      'Vehicle Dynamics & Testing Engineer',
      'ADAS & Automotive Systems Engineer',
      'Motorsport & Mobility R&D',
    ],
  },
  {
    code: 'RME',
    name: 'Robotics & Mechatronics Engineering (RME)',
    category: 'Mechanical & Mobility',
    subjects: [
      'Robot Kinematics, Dynamics & Trajectory Planning',
      'Actuators, Stepper/Servo Drives & Hydraulics',
      'Embedded Microcontrollers & Real-Time Operating Systems',
      'Machine Vision, SLAM & Autonomous Navigation',
    ],
    skills: [
      'ROS 2 (Robot Operating System) & Gazebo simulation',
      'C++ / Python real-time sensor fusion (IMU + LiDAR)',
      'Mechanical linkage CAD & actuator sizing',
      'Closed-loop motion control',
    ],
    activities: [
      'Simulate a differential-drive mobile robot navigating obstacles in Gazebo',
      'Implement forward & inverse kinematics for a 3-DOF robotic arm',
      'Fuse ultrasonic/IMU sensor readings using a complementary filter',
    ],
    future: [
      'Robotics Software & Controls Engineer',
      'Autonomous Systems / Drone Engineer',
      'Industrial Automation Integrator',
      'Mechatronics R&D Specialist',
    ],
  },
  {
    code: 'IPE',
    name: 'Industrial & Production Engineering (IPE)',
    category: 'Mechanical & Mobility',
    subjects: [
      'Operations Research & Linear Optimization',
      'Production Planning, Lean Manufacturing & Six Sigma',
      'Quality Engineering & Statistical Process Control',
      'Supply Chain, Ergonomics & Smart Factory Systems',
    ],
    skills: [
      'Lean / DMAIC Six Sigma problem solving',
      'Linear programming & scheduling (Python / Excel Solver)',
      'Time-motion work study & facility layout CAD',
      'Inventory & MRP forecasting',
    ],
    activities: [
      'Map value streams for a sample assembly line to cut cycle bottlenecks',
      'Build an EOQ & safety-stock simulation under demand variability',
      'Run statistical control charts (X-bar and R) on production samples',
    ],
    future: [
      'Industrial / Operations Engineer',
      'Supply Chain & Logistics Analyst',
      'Quality Assurance & Six Sigma Lead',
      'Manufacturing Plant Operations Manager',
    ],
  },
  {
    code: 'CE',
    name: 'Civil Engineering (CE)',
    category: 'Infrastructure & Aerospace',
    subjects: [
      'Structural Analysis & Reinforced Concrete / Steel Design',
      'Geotechnical Engineering & Soil Mechanics',
      'Surveying, GIS & Transportation Engineering',
      'Hydraulics, Water Resources & Environmental Engineering',
    ],
    skills: [
      'AutoCAD, Revit BIM & STAAD.Pro / ETABS structural modeling',
      'IS 456 / IS 800 code compliance checks',
      'Quantity estimation, costing & project scheduling (MS Project)',
      'Total Station & QGIS spatial mapping',
    ],
    activities: [
      'Model and analyze a G+3 RCC frame under dead, live, and seismic loads',
      'Prepare a complete bar-bending schedule and quantity takeoff',
      'Conduct soil sieve analysis and Proctor compaction lab calculations',
    ],
    future: [
      'Structural Design Engineer',
      'Construction Project Manager & BIM Specialist',
      'Geotechnical & Highway Infrastructure Engineer',
      'Public Works / Civil Services Engineering',
    ],
  },
  {
    code: 'AE',
    name: 'Aerospace & Aeronautical Engineering (AE)',
    category: 'Infrastructure & Aerospace',
    subjects: [
      'Aerodynamics & Compressible Gas Dynamics',
      'Aircraft Structures & Composite Materials',
      'Flight Mechanics, Stability & Control',
      'Jet & Rocket Propulsion Systems',
    ],
    skills: [
      'CFD simulation (ANSYS Fluent / OpenFOAM)',
      'Airfoil polar analysis (XFOIL / XFLR5)',
      'Composite layup & buckling analysis',
      'Flight telemetry & trajectory simulation in Python/MATLAB',
    ],
    activities: [
      'Compare NACA airfoil lift-to-drag ratios across angles of attack',
      'Size a UAV wing, battery, and propulsion system for a target endurance',
      'Simulate a 2-stage rocket ascent trajectory with drag modeling',
    ],
    future: [
      'Aerodynamics & CFD Engineer',
      'Propulsion & Avionics Systems Engineer',
      'UAV / Spaceflight Structures Engineer',
      'Defense & Space Research Organizations',
    ],
  },
  {
    code: 'CHE',
    name: 'Chemical Engineering (CHE)',
    category: 'Chemical, Bio & Materials',
    subjects: [
      'Chemical Process Calculations & Thermodynamics',
      'Fluid Flow, Heat & Mass Transfer Operations',
      'Chemical Reaction Engineering & Catalysis',
      'Process Dynamics, Control & Plant Safety',
    ],
    skills: [
      'Process flowsheet simulation (Aspen Plus / DWSIM)',
      'Distillation column & heat exchanger sizing',
      'HAZOP safety & environmental compliance',
      'Reaction kinetics modeling in Python/MATLAB',
    ],
    activities: [
      'Simulate a binary distillation column in open-source DWSIM',
      'Solve shell-and-tube heat exchanger LMTD sizing problems',
      'Analyze CSTR vs PFR conversion trade-offs for industrial reactions',
    ],
    future: [
      'Process Design Engineer',
      'Energy, Petrochemical & Battery Materials Engineer',
      'Pharmaceutical Manufacturing Engineer',
      'Environmental & Sustainability Consultant',
    ],
  },
  {
    code: 'BT',
    name: 'Biotechnology Engineering (BT)',
    category: 'Chemical, Bio & Materials',
    subjects: [
      'Microbiology, Biochemistry & Cell Biology',
      'Molecular Biology & Genetic Engineering',
      'Bioprocess Engineering & Bioreactor Design',
      'Bioinformatics & Downstream Bioseparation',
    ],
    skills: [
      'Sequence alignment & bioinformatics tools (BLAST / Biopython)',
      'Sterile culture, PCR primer design & ELISA concepts',
      'Fermentation mass-balance & oxygen-transfer calculations',
      'GLP/GMP regulatory documentation',
    ],
    activities: [
      'Write a Python script to translate DNA sequences and check GC content',
      'Design an upstream-to-downstream purification flowsheet for insulin',
      'Practice enzyme kinetics (Michaelis-Menten) curve fitting',
    ],
    future: [
      'Bioprocess & Biopharma Engineer',
      'Bioinformatics & Genomics Analyst',
      'Clinical Research & Quality Specialist',
      'M.Tech / PhD in Life Sciences',
    ],
  },
  {
    code: 'MME',
    name: 'Metallurgical & Materials Engineering (MME)',
    category: 'Chemical, Bio & Materials',
    subjects: [
      'Physical Metallurgy & Phase Transformations',
      'Extractive Metallurgy & Corrosion Engineering',
      'Ceramics, Polymers & Advanced Composites',
      'Materials Characterization (XRD, SEM, Mechanical Testing)',
    ],
    skills: [
      'Phase diagram interpretation & heat-treatment selection',
      'Failure & fractography analysis',
      'Non-destructive testing (NDT) methods',
      'Battery & semiconductor materials fundamentals',
    ],
    activities: [
      'Construct cooling curves and predict Fe-Fe3C microstructures',
      'Compare corrosion protection coatings across marine environments',
      'Analyze tensile stress-strain curves to compute yield, UTS, and toughness',
    ],
    future: [
      'Materials & Failure Analysis Engineer',
      'Steel, Aerospace Alloys & Foundry Specialist',
      'Semiconductor / Battery Materials Researcher',
      'Quality & Welding Inspection Engineer',
    ],
  },
  {
    code: 'MPE',
    name: 'Mining & Petroleum Engineering (MPE)',
    category: 'Chemical, Bio & Materials',
    subjects: [
      'Engineering Geology & Rock Mechanics',
      'Surface & Underground Mine Planning & Ventilation',
      'Reservoir Engineering & Drilling Operations',
      'Geostatistics, Mine Safety & Environmental Reclamation',
    ],
    skills: [
      'Ore grade estimation & GIS reserve mapping',
      'Ventilation network & slope stability calculations',
      'Well-log interpretation & Darcy flow modeling',
      'Mine safety & DGMS regulatory compliance',
    ],
    activities: [
      'Analyze Mohr-Coulomb rock failure envelopes from triaxial test data',
      'Calculate hydrostatic mud-weight pressure vs formation pore pressure',
      'Map mine reclamation and water-table monitoring plans',
    ],
    future: [
      'Mining Operations & Geotechnical Engineer',
      'Petroleum Reservoir / Drilling Engineer',
      'Mineral Processing & Exploration Specialist',
      'Energy Transition & Carbon Storage Engineer',
    ],
  },
];

export const NON_ENG_ROADMAPS: Record<string, RoadmapData> = {
  PCMC: {
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Computer Science'],
    skills: ['Logical thinking', 'Basic programming', 'Problem solving', 'Communication'],
    activities: [
      'Practise maths problems regularly',
      'Try beginner coding exercises',
      'Make short notes for each topic',
    ],
    future: ['Computer Science', 'Engineering', 'Data Science', 'Technology-related degrees'],
  },
  PCMB: {
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    skills: ['Observation', 'Scientific thinking', 'Problem solving', 'Communication'],
    activities: [
      'Draw and label science diagrams',
      'Practise numerical problems',
      'Explore simple science activities',
    ],
    future: ['Engineering', 'Medicine-related pathways', 'Life sciences', 'Biotechnology'],
  },
  PCMS: {
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Statistics'],
    skills: ['Data interpretation', 'Logical thinking', 'Numerical skills', 'Communication'],
    activities: [
      'Practise calculations',
      'Read simple data charts',
      'Explore beginner spreadsheet tasks',
    ],
    future: ['Statistics', 'Data Science', 'Engineering', 'Science degrees'],
  },
  Commerce: {
    subjects: ['Accountancy', 'Business Studies', 'Economics', 'Language subjects'],
    skills: [
      'Financial awareness',
      'Communication',
      'Basic spreadsheets',
      'Analytical thinking',
    ],
    activities: [
      'Prepare a simple budget',
      'Practise basic accounting entries',
      'Read a business news story',
    ],
    future: ['B.Com', 'BBA', 'Economics', 'Finance-related courses'],
  },
  Arts: {
    subjects: ['History', 'Political Science', 'Sociology', 'Language subjects'],
    skills: ['Writing', 'Research', 'Critical thinking', 'Communication'],
    activities: [
      'Write a short topic summary',
      'Compare two viewpoints',
      'Practise public speaking',
    ],
    future: ['BA programmes', 'Law', 'Journalism', 'Social sciences'],
  },
  'B.Sc / Science': {
    subjects: ['Core Science Major', 'Research Methodology', 'Lab Practicals'],
    skills: ['Scientific writing', 'Statistical analysis', 'Lab instrumentation'],
    activities: ['Complete a literature review', 'Participate in science exhibitions'],
    future: ['M.Sc', 'Research Fellowships (DST INSPIRE)', 'Analytics Roles'],
  },
  'BCA / Computing': {
    subjects: ['Programming in C/Python/Java', 'DBMS', 'Web Engineering'],
    skills: ['Software development', 'SQL querying', 'Version control'],
    activities: ['Build 2 portfolio web apps', 'Solve weekly coding challenges'],
    future: ['MCA', 'Software Developer', 'Cloud Associate'],
  },
  'B.Com / BBA': {
    subjects: ['Financial Accounting', 'Corporate Law', 'Business Analytics'],
    skills: ['Spreadsheet modeling', 'Presentation', 'Financial reporting'],
    activities: ['Analyze an annual company report', 'Lead a case study'],
    future: ['MBA / PGDM', 'Chartered Accountancy', 'Financial Analyst'],
  },
  'BA / Humanities': {
    subjects: ['Core Humanities Papers', 'Public Policy', 'Academic Writing'],
    skills: ['Critical reasoning', 'Policy analysis', 'Communication'],
    activities: ['Write weekly analytical essays', 'Join debate clubs'],
    future: ['Civil Services', 'LLB / Law', 'Journalism & Media'],
  },
};

export const MOCK_TEST_BANK: MockQuestion[] = [
  // CSE & ISE shared / specific
  {
    id: 'cse-1',
    branchKey: 'CSE',
    topic: 'Data Structures & Algorithms',
    question: 'What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (such as an AVL tree) with n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctIndex: 1,
    explanation: 'Balanced BSTs keep tree height proportional to log n, so each comparison halves the remaining search space.',
  },
  {
    id: 'cse-2',
    branchKey: 'CSE',
    topic: 'Operating Systems',
    question: 'Which of the following is NOT one of the four necessary Coffman conditions for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Preemptive Scheduling', 'Circular Wait'],
    correctIndex: 2,
    explanation: 'Deadlock requires Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemptive scheduling helps break No Preemption.',
  },
  {
    id: 'cse-3',
    branchKey: 'CSE',
    topic: 'Databases',
    question: 'Which normal form eliminates transitive dependencies of non-prime attributes on a candidate key?',
    options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Denormalized Form'],
    correctIndex: 2,
    explanation: '3NF ensures every non-prime attribute depends directly on the key (no transitive dependency through another non-prime attribute).',
  },
  {
    id: 'cse-4',
    branchKey: 'CSE',
    topic: 'Computer Networks',
    question: 'Which transport-layer protocol provides reliable, ordered, byte-stream delivery using acknowledgments and flow control?',
    options: ['UDP', 'TCP', 'ICMP', 'ARP'],
    correctIndex: 1,
    explanation: 'TCP uses sequence numbers, ACKs, congestion control, and sliding windows for reliable delivery.',
  },
  {
    id: 'cse-5',
    branchKey: 'CSE',
    topic: 'Algorithms',
    question: 'Which algorithm finds the shortest path from a single source in a graph with non-negative edge weights?',
    options: ["Kruskal's Algorithm", "Dijkstra's Algorithm", "Prim's Algorithm", 'Floyd-Warshall Only'],
    correctIndex: 1,
    explanation: "Dijkstra's greedy algorithm computes shortest paths cleanly when all edge weights are >= 0.",
  },

  // ISE
  {
    id: 'ise-1',
    branchKey: 'ISE',
    topic: 'Web & APIs',
    question: 'Which HTTP status code indicates that a request succeeded and a new resource was created on the server?',
    options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
    correctIndex: 1,
    explanation: 'HTTP 201 Created is returned by REST APIs after successfully creating a new record (e.g., via POST).',
  },
  {
    id: 'ise-2',
    branchKey: 'ISE',
    topic: 'Software Testing',
    question: 'Testing individual functions or modules in isolation before integrating them is known as:',
    options: ['Acceptance Testing', 'Unit Testing', 'Regression Testing', 'Load Testing'],
    correctIndex: 1,
    explanation: 'Unit testing verifies small, isolated units of code independently of external dependencies.',
  },
  {
    id: 'ise-3',
    branchKey: 'ISE',
    topic: 'Cloud Computing',
    question: 'Which cloud service model provides managed runtime platforms so developers can deploy code without managing OS patches?',
    options: ['IaaS', 'PaaS', 'Bare Metal Colocation', 'SAN Storage'],
    correctIndex: 1,
    explanation: 'Platform as a Service (PaaS) abstracts OS and infrastructure management so teams focus on app code.',
  },
  {
    id: 'ise-4',
    branchKey: 'ISE',
    topic: 'Database Engineering',
    question: 'What does an index on a SQL table column primarily accelerate at the cost of extra storage and write overhead?',
    options: ['SELECT lookups & WHERE filters', 'Deleting the entire table', 'Encrypting user passwords', 'Disabling foreign keys'],
    correctIndex: 0,
    explanation: 'B-tree indexes let the database engine locate matching rows in O(log n) instead of scanning the entire table.',
  },
  {
    id: 'ise-5',
    branchKey: 'ISE',
    topic: 'DevOps',
    question: 'In Git, which command creates a local copy of a remote repository along with its commit history?',
    options: ['git merge', 'git clone', 'git rebase', 'git stash'],
    correctIndex: 1,
    explanation: '`git clone <url>` downloads the repository, branches, and full history into a new local directory.',
  },

  // AI & ML
  {
    id: 'aiml-1',
    branchKey: 'AIML',
    topic: 'Model Evaluation',
    question: 'A binary classifier achieves 99% accuracy on a dataset where 99% of samples are negative. Which metric best reveals if it catches actual positives?',
    options: ['Training Loss', 'Recall & F1-Score for the positive class', 'Number of Epochs', 'Batch Size'],
    correctIndex: 1,
    explanation: 'On heavily imbalanced data, accuracy is misleading; Precision, Recall, and F1 expose minority-class performance.',
  },
  {
    id: 'aiml-2',
    branchKey: 'AIML',
    topic: 'Optimization',
    question: 'What happens if the learning rate in gradient descent is set much too high?',
    options: [
      'The model always finds the global minimum faster',
      'Updates may overshoot the minimum and cause loss to diverge',
      'Weights freeze at zero',
      'Training dataset size doubles automatically',
    ],
    correctIndex: 1,
    explanation: 'Excessively large gradient steps overshoot the valley of the loss surface, leading to oscillation or divergence.',
  },
  {
    id: 'aiml-3',
    branchKey: 'AIML',
    topic: 'Regularization',
    question: 'How does Dropout help prevent overfitting during neural network training?',
    options: [
      'By deleting 50% of training rows permanently',
      'By randomly zeroing neuron activations during training so nodes do not co-adapt',
      'By removing activation functions',
      'By doubling the learning rate',
    ],
    correctIndex: 1,
    explanation: 'Randomly dropping units forces redundant, generalizable representations across the network.',
  },
  {
    id: 'aiml-4',
    branchKey: 'AIML',
    topic: 'Deep Learning',
    question: 'Which mechanism allows Transformer architectures to weigh relationships between all tokens in a sequence in parallel?',
    options: ['K-Means Clustering', 'Self-Attention', 'Max Pooling', 'Naive Bayes'],
    correctIndex: 1,
    explanation: 'Scaled dot-product self-attention computes context weights across every token pair simultaneously.',
  },
  {
    id: 'aiml-5',
    branchKey: 'AIML',
    topic: 'Generalization',
    question: 'A model has near-zero training error but very high validation error. What is this condition called?',
    options: ['Underfitting', 'Overfitting (High Variance)', 'Data Normalization', 'Convergence'],
    correctIndex: 1,
    explanation: 'Overfitting occurs when a model memorizes noise in the training set rather than general patterns.',
  },

  // Data Science
  {
    id: 'ds-1',
    branchKey: 'DS',
    topic: 'Statistics',
    question: 'Which central tendency measure is least affected by extreme outlier values in a salary dataset?',
    options: ['Arithmetic Mean', 'Median', 'Range', 'Variance'],
    correctIndex: 1,
    explanation: 'The median depends only on the middle rank, making it robust against extreme outliers.',
  },
  {
    id: 'ds-2',
    branchKey: 'DS',
    topic: 'Hypothesis Testing',
    question: 'If a statistical test yields a p-value of 0.012 at significance level alpha = 0.05, what is the standard decision?',
    options: ['Fail to reject the null hypothesis', 'Reject the null hypothesis', 'Delete the sample', 'Increase alpha to 1.0'],
    correctIndex: 1,
    explanation: 'Since p = 0.012 < alpha = 0.05, the observed result is statistically significant under the chosen threshold.',
  },
  {
    id: 'ds-3',
    branchKey: 'DS',
    topic: 'SQL Analytics',
    question: 'Which SQL clause calculates running totals or rankings across rows without collapsing rows into a single group row?',
    options: ['GROUP BY', 'Window Functions (OVER)', 'TRUNCATE', 'DISTINCT'],
    correctIndex: 1,
    explanation: 'Window functions using `OVER (PARTITION BY ... ORDER BY ...)` compute aggregates while keeping row granularity.',
  },
  {
    id: 'ds-4',
    branchKey: 'DS',
    topic: 'Feature Engineering',
    question: 'Why is feature scaling (e.g., Standardization) critical before running PCA or k-Nearest Neighbors?',
    options: [
      'Because features with larger numeric ranges would otherwise dominate distance/variance calculations',
      'Because SQL requires normalized floats',
      'To convert categorical strings into images',
      'To increase missing values',
    ],
    correctIndex: 0,
    explanation: 'Distance-based and variance-based methods are sensitive to variable units and scale.',
  },
  {
    id: 'ds-5',
    branchKey: 'DS',
    topic: 'Data Quality',
    question: 'What is "data leakage" when building a predictive machine learning pipeline?',
    options: [
      'Using slow CSV files instead of Parquet',
      'Information from the test/future target leaking into training features',
      'Compressing data with gzip',
      'Removing duplicate rows',
    ],
    correctIndex: 1,
    explanation: 'Data leakage inflates validation scores artificially and causes failure on real unseen production data.',
  },

  // Cyber Security & Blockchain
  {
    id: 'csb-1',
    branchKey: 'CSB',
    topic: 'Web Security',
    question: 'What is the single most effective defense against SQL Injection in backend database queries?',
    options: [
      'Client-side JavaScript alerts',
      'Parameterized queries / Prepared statements',
      'Hiding the database port from CSS',
      'Base64-encoding the SQL query string',
    ],
    correctIndex: 1,
    explanation: 'Parameterized queries separate SQL syntax from user-supplied data so input cannot alter query logic.',
  },
  {
    id: 'csb-2',
    branchKey: 'CSB',
    topic: 'Network Security',
    question: 'Why does ScholarShield validate that a URL host does not resolve to 127.0.0.1 or 169.254.169.254 before fetching?',
    options: [
      'To speed up CSS rendering',
      'To prevent Server-Side Request Forgery (SSRF) against internal cloud metadata',
      'To enable FTP uploads',
      'To bypass HTTPS certificates',
    ],
    correctIndex: 1,
    explanation: 'Blocking loopback, private RFC1918, and link-local metadata IPs mitigates SSRF attacks.',
  },
  {
    id: 'csb-3',
    branchKey: 'CSB',
    topic: 'Cryptography',
    question: 'Which property ensures that a cryptographic hash function (e.g. SHA-256) cannot practically be reversed to recover the input?',
    options: ['Symmetric key rotation', 'Pre-image resistance (One-way property)', 'Padding oracle', 'Cleartext transport'],
    correctIndex: 1,
    explanation: 'Pre-image resistance guarantees it is computationally infeasible to find an input hashing to a given digest.',
  },
  {
    id: 'csb-4',
    branchKey: 'CSB',
    topic: 'Phishing Defense',
    question: 'An attacker registers `sch0larships-gov-in.com` pretending to be `scholarships.gov.in`. This technique is called:',
    options: ['Port Scanning', 'Typosquatting / Domain Impersonation', 'Buffer Overflow', 'ARP Poisoning'],
    correctIndex: 1,
    explanation: 'Typosquatting uses visually similar characters or fake hyphens under commercial TLDs like .com instead of .gov.in.',
  },
  {
    id: 'csb-5',
    branchKey: 'CSB',
    topic: 'Blockchain',
    question: 'In a blockchain block header, what links block N cryptographically to block N-1?',
    options: ['IPv4 Gateway Address', 'The cryptographic hash of the previous block', 'FTP Timestamp', 'DNS TXT record'],
    correctIndex: 1,
    explanation: 'Embedding the previous block hash creates an immutable tamper-evident chain.',
  },

  // ECE
  {
    id: 'ece-1',
    branchKey: 'ECE',
    topic: 'Digital Signal Processing',
    question: 'According to the Nyquist-Shannon sampling theorem, to avoid aliasing, a bandlimited signal with max frequency f_max must be sampled at:',
    options: ['f_s >= f_max / 2', 'f_s >= f_max', 'f_s > 2 * f_max', 'f_s = 0'],
    correctIndex: 2,
    explanation: 'The sampling rate must exceed twice the highest frequency component (2 * f_max) to reconstruct without aliasing.',
  },
  {
    id: 'ece-2',
    branchKey: 'ECE',
    topic: 'Digital Electronics',
    question: 'Which logic gate outputs HIGH (1) only when an odd number of its inputs are HIGH?',
    options: ['AND', 'NAND', 'XOR', 'NOR'],
    correctIndex: 2,
    explanation: 'XOR (Exclusive OR) outputs 1 when its inputs differ (odd parity of 1s).',
  },
  {
    id: 'ece-3',
    branchKey: 'ECE',
    topic: 'Analog Circuits',
    question: 'In an ideal operational amplifier with negative feedback, the voltage difference between the inverting and non-inverting inputs approaches:',
    options: ['Supply voltage Vcc', 'Zero volts (virtual short)', 'Infinity', '-Vcc'],
    correctIndex: 1,
    explanation: 'High open-loop gain with negative feedback forces V+ ≈ V- (virtual short principle).',
  },
  {
    id: 'ece-4',
    branchKey: 'ECE',
    topic: 'Embedded Systems',
    question: 'Which serial communication protocol uses two wires (SDA and SCL) and supports multiple addressed slave devices on the same bus?',
    options: ['I2C', 'RS-232 Simplex', 'Parallel Centronics', 'PWM'],
    correctIndex: 0,
    explanation: 'I2C uses Serial Data (SDA) and Serial Clock (SCL) with 7-bit or 10-bit device addressing.',
  },
  {
    id: 'ece-5',
    branchKey: 'ECE',
    topic: 'Communication Systems',
    question: 'What is the primary advantage of Frequency Modulation (FM) over Amplitude Modulation (AM) in radio broadcast?',
    options: [
      'Lower bandwidth usage always',
      'Superior immunity to amplitude-based electrical noise',
      'Zero carrier power required',
      'Works without antennas',
    ],
    correctIndex: 1,
    explanation: 'Most environmental noise spikes affect signal amplitude; FM encodes information in frequency variations and uses limiters.',
  },

  // EEE
  {
    id: 'eee-1',
    branchKey: 'EEE',
    topic: 'Circuit Theory',
    question: "Kirchhoff's Current Law (KCL) at any node in a lumped electric circuit is a direct consequence of:",
    options: ['Conservation of Charge', 'Conservation of Angular Momentum', 'Second Law of Thermodynamics', "Faraday's Law only"],
    correctIndex: 0,
    explanation: 'Charge cannot accumulate instantaneously at a node, so sum of currents entering equals sum leaving.',
  },
  {
    id: 'eee-2',
    branchKey: 'EEE',
    topic: 'Electrical Machines',
    question: 'In a practical transformer, hysteresis and eddy-current losses together make up which category of loss?',
    options: ['Copper (I²R) loss', 'Core / Iron loss', 'Windage loss', 'Stray load loss only'],
    correctIndex: 1,
    explanation: 'Core losses depend primarily on supply voltage and frequency rather than load current.',
  },
  {
    id: 'eee-3',
    branchKey: 'EEE',
    topic: 'Power Systems',
    question: 'Why is electrical power transmitted over long distances at very high voltages?',
    options: [
      'To decrease current for a given power and minimize I²R transmission line losses',
      'To eliminate insulators',
      'To convert AC into mechanical torque',
      'Because transformers only work at 50 Hz below 10 V',
    ],
    correctIndex: 0,
    explanation: 'Since P = V·I, stepping up V reduces current I, dramatically lowering I²R resistive heat loss.',
  },
  {
    id: 'eee-4',
    branchKey: 'EEE',
    topic: 'Power Electronics',
    question: 'In a buck (step-down) DC-DC converter operating in continuous conduction mode with duty cycle D (0 < D < 1), ideal V_out equals:',
    options: ['V_in / D', 'D · V_in', 'V_in / (1 - D)', 'D² · V_in'],
    correctIndex: 1,
    explanation: 'A buck converter steps down input voltage proportionally to switch duty ratio: V_out = D * V_in.',
  },
  {
    id: 'eee-5',
    branchKey: 'EEE',
    topic: 'Control Systems',
    question: 'Which term in a PID controller eliminates steady-state offset error for a step input?',
    options: ['Proportional (P) alone', 'Integral (I)', 'Derivative (D) alone', 'Feedforward gain zero'],
    correctIndex: 1,
    explanation: 'The Integral action accumulates persistent steady-state error over time until the error drives to zero.',
  },

  // Mechanical
  {
    id: 'me-1',
    branchKey: 'ME',
    topic: 'Thermodynamics',
    question: 'Which thermodynamic cycle represents the idealized reversible benchmark for maximum thermal efficiency between two temperature reservoirs?',
    options: ['Rankine Cycle', 'Carnot Cycle', 'Otto Cycle', 'Brayton Cycle'],
    correctIndex: 1,
    explanation: 'Carnot efficiency η = 1 - T_cold / T_hot sets the upper theoretical bound for heat engines.',
  },
  {
    id: 'me-2',
    branchKey: 'ME',
    topic: 'Strength of Materials',
    question: 'Within the elastic proportional limit of a ductile steel bar, stress is directly proportional to strain according to:',
    options: ["Bernoulli's Principle", "Hooke's Law", "Fourier's Law", "Pascal's Law"],
    correctIndex: 1,
    explanation: "Hooke's Law states σ = E · ε, where E is Young's Modulus.",
  },
  {
    id: 'me-3',
    branchKey: 'ME',
    topic: 'Fluid Mechanics',
    question: 'A Reynolds number (Re) well below 2000 for steady pipe flow indicates which flow regime?',
    options: ['Supersonic compressible flow', 'Laminar flow', 'Fully developed turbulent flow', 'Cavitation'],
    correctIndex: 1,
    explanation: 'Low Reynolds numbers indicate viscous forces dominate inertial forces, keeping fluid layers smooth and laminar.',
  },
  {
    id: 'me-4',
    branchKey: 'ME',
    topic: 'Heat Transfer',
    question: 'Which mode of heat transfer can occur across a complete vacuum without any material medium?',
    options: ['Conduction', 'Forced Convection', 'Thermal Radiation', 'Natural Convection'],
    correctIndex: 2,
    explanation: 'Thermal radiation propagates via electromagnetic waves and needs no medium.',
  },
  {
    id: 'me-5',
    branchKey: 'ME',
    topic: 'Manufacturing',
    question: 'Which additive manufacturing metric describes the vertical slice height printed on each pass?',
    options: ['Draft angle', 'Layer thickness (resolution)', 'Mach number', 'Rockwell hardness'],
    correctIndex: 1,
    explanation: 'Finer layer thickness improves surface finish and Z-axis detail at the expense of print time.',
  },

  // Civil Engineering
  {
    id: 'ce-1',
    branchKey: 'CE',
    topic: 'Concrete Technology',
    question: 'What is the primary purpose of adding water to cement beyond the minimum required for hydration (excess water-cement ratio)?',
    options: [
      'It increases final compressive strength',
      'It increases capillary porosity and lowers compressive strength',
      'It prevents shrinkage completely',
      'It eliminates curing requirements',
    ],
    correctIndex: 1,
    explanation: "Per Abrams' law, higher water-cement ratio beyond hydration needs creates voids that weaken hardened concrete.",
  },
  {
    id: 'ce-2',
    branchKey: 'CE',
    topic: 'Structural Analysis',
    question: 'In a simply supported beam carrying a uniformly distributed load, where does the maximum bending moment occur?',
    options: ['At both supports', 'At mid-span where shear force is zero', 'At quarter-span only', 'Nowhere; bending moment is constant'],
    correctIndex: 1,
    explanation: 'Because dM/dx = V, bending moment reaches an extremum where shear force V crosses zero (mid-span for symmetric loading).',
  },
  {
    id: 'ce-3',
    branchKey: 'CE',
    topic: 'Geotechnical Engineering',
    question: 'Which laboratory test determines the optimum moisture content and maximum dry density of compacted soil?',
    options: ['Slump Cone Test', 'Proctor Compaction Test', 'Los Angeles Abrasion Test', 'Vicat Needle Test'],
    correctIndex: 1,
    explanation: 'Standard/Modified Proctor compaction establishes the moisture-density curve for earthwork compaction.',
  },
  {
    id: 'ce-4',
    branchKey: 'CE',
    topic: 'Surveying',
    question: 'Which optical/electronic instrument measures both horizontal/vertical angles and slope distances simultaneously?',
    options: ['Dumpy Level', 'Total Station', 'Chain & Tape', 'Venturimeter'],
    correctIndex: 1,
    explanation: 'A Total Station combines an electronic theodolite with Electronic Distance Measurement (EDM).',
  },
  {
    id: 'ce-5',
    branchKey: 'CE',
    topic: 'Environmental Engineering',
    question: 'BOD₅ (5-day Biochemical Oxygen Demand) measures what property of a wastewater sample?',
    options: [
      'Dissolved heavy metal hardness',
      'Oxygen consumed by microorganisms decomposing organic matter over 5 days at 20°C',
      'pH alkalinity',
      'Total suspended sand particles',
    ],
    correctIndex: 1,
    explanation: 'BOD₅ quantifies biodegradable organic pollution strength in wastewater.',
  },

  // Aerospace
  {
    id: 'ae-1',
    branchKey: 'AE',
    topic: 'Aerodynamics',
    question: 'When angle of attack exceeds the critical stall angle on an airfoil, why does lift drop sharply?',
    options: [
      'Gravity reverses direction',
      'Flow separates over the upper surface, forming a large turbulent wake',
      'Air density turns negative',
      'Propeller RPM doubles automatically',
    ],
    correctIndex: 1,
    explanation: 'Adverse pressure gradients detach the boundary layer near the upper surface, causing aerodynamic stall.',
  },
  {
    id: 'ae-2',
    branchKey: 'AE',
    topic: 'Gas Dynamics',
    question: 'What does Mach number M = V / a represent?',
    options: [
      'Ratio of flow speed to local speed of sound',
      'Ratio of lift to drag',
      'Ratio of wing span to chord',
      'Ratio of thrust to weight',
    ],
    correctIndex: 0,
    explanation: 'Mach number compares object/fluid speed V against local acoustic speed a = sqrt(γ R T).',
  },
  {
    id: 'ae-3',
    branchKey: 'AE',
    topic: 'Propulsion',
    question: 'Which propulsion parameter expresses thrust produced per unit weight flow rate of propellant per second (measured in seconds)?',
    options: ['Aspect Ratio', 'Specific Impulse (Isp)', 'Reynolds Number', 'Wing Loading'],
    correctIndex: 1,
    explanation: 'Higher Specific Impulse (Isp) indicates greater fuel/propellant efficiency for jet and rocket engines.',
  },
  {
    id: 'ae-4',
    branchKey: 'AE',
    topic: 'Flight Mechanics',
    question: 'Which control surfaces on an aircraft primarily control roll motion about the longitudinal axis?',
    options: ['Rudder', 'Ailerons', 'Elevators', 'Spoilers only'],
    correctIndex: 1,
    explanation: 'Differential deflection of left and right ailerons generates rolling moments.',
  },
  {
    id: 'ae-5',
    branchKey: 'AE',
    topic: 'Orbital Mechanics',
    question: 'In an elliptical orbit around Earth, where does a satellite travel at its highest orbital speed?',
    options: ['Apogee', 'Perigee', 'Semi-minor axis endpoints', 'Speed is constant everywhere'],
    correctIndex: 1,
    explanation: "By Kepler's second law and conservation of angular momentum, speed peaks at closest approach (perigee).",
  },

  // Chemical Engineering
  {
    id: 'che-1',
    branchKey: 'CHE',
    topic: 'Separation Processes',
    question: 'Distillation separates liquid mixtures primarily based on differences in which physical property?',
    options: ['Electrical conductivity', 'Relative volatility / Boiling points', 'Magnetic susceptibility', 'Density only'],
    correctIndex: 1,
    explanation: 'Components vaporize in different proportions according to vapor-liquid equilibrium and relative volatility.',
  },
  {
    id: 'che-2',
    branchKey: 'CHE',
    topic: 'Heat Transfer',
    question: 'In a shell-and-tube heat exchanger, which flow arrangement gives a higher Log Mean Temperature Difference (LMTD) for the same terminal temperatures?',
    options: ['Parallel (co-current) flow', 'Counter-current flow', 'Dead-end stagnant shell', 'No-flow'],
    correctIndex: 1,
    explanation: 'Counter-current flow maintains a more uniform driving ΔT along the length, maximizing LMTD.',
  },
  {
    id: 'che-3',
    branchKey: 'CHE',
    topic: 'Reaction Engineering',
    question: 'Why does a solid catalyst speed up a chemical reaction?',
    options: [
      'It shifts thermodynamic equilibrium ΔG permanently',
      'It provides an alternate pathway with lower activation energy Ea',
      'It turns endothermic reactions exothermic',
      'It gets consumed stoichiometrically',
    ],
    correctIndex: 1,
    explanation: 'Catalysts lower the activation energy barrier without altering overall reaction thermodynamics.',
  },
  {
    id: 'che-4',
    branchKey: 'CHE',
    topic: 'Fluid Transport',
    question: 'What does NPSH (Net Positive Suction Head) ensure when sizing a centrifugal chemical pump?',
    options: [
      'Preventing impeller cavitation by keeping suction pressure above vapor pressure',
      'Increasing pipe corrosion',
      'Measuring fluid viscosity in cP',
      'Converting laminar to supersonic flow',
    ],
    correctIndex: 0,
    explanation: 'Maintaining NPSH_available > NPSH_required avoids vapor bubble formation and impeller damage.',
  },
  {
    id: 'che-5',
    branchKey: 'CHE',
    topic: 'Process Safety',
    question: 'What does HAZOP stand for in chemical plant safety reviews?',
    options: [
      'Hazardous Waste Operating Permit',
      'Hazard and Operability Study',
      'High-Altitude Zero Oxygen Pressure',
      'Heat Absorption Zone Optimization',
    ],
    correctIndex: 1,
    explanation: 'HAZOP systematically inspects piping and instrumentation nodes using guidewords (More, Less, No, Reverse) to find process risks.',
  },

  // Biotechnology
  {
    id: 'bt-1',
    branchKey: 'BT',
    topic: 'Molecular Biology',
    question: 'Which enzyme synthesizes new DNA strands by extending primers during Polymerase Chain Reaction (PCR)?',
    options: ['RNA Primase', 'Thermostable DNA Polymerase (e.g. Taq)', 'Amylase', 'Catalase'],
    correctIndex: 1,
    explanation: 'Taq polymerase survives 95°C denaturation cycles and extends primers at ~72°C.',
  },
  {
    id: 'bt-2',
    branchKey: 'BT',
    topic: 'Bioprocess Engineering',
    question: 'In aerobic microbial fermentation inside a stirred-tank bioreactor, which parameter most often limits scale-up?',
    options: ['Gravity', 'Volumetric oxygen mass transfer coefficient (kLa)', 'Light refraction', 'Glass thickness'],
    correctIndex: 1,
    explanation: 'Oxygen has low solubility in aqueous broths, making kLa and sparging/agitation critical at industrial scale.',
  },
  {
    id: 'bt-3',
    branchKey: 'BT',
    topic: 'Enzyme Kinetics',
    question: 'In Michaelis-Menten kinetics, what is Km (the Michaelis constant)?',
    options: [
      'Maximum reaction velocity Vmax',
      'Substrate concentration at which reaction velocity is half of Vmax',
      'Enzyme molecular weight',
      'Optimal temperature in Kelvin',
    ],
    correctIndex: 1,
    explanation: 'Km reflects substrate affinity; lower Km means higher apparent affinity of enzyme for substrate.',
  },
  {
    id: 'bt-4',
    branchKey: 'BT',
    topic: 'Downstream Processing',
    question: 'Which chromatographic technique separates proteins based on specific reversible binding to an immobilized ligand?',
    options: ['Gravity settling', 'Affinity Chromatography', 'Simple Sieving', 'Centrifugal drying'],
    correctIndex: 1,
    explanation: 'Affinity chromatography (e.g. Protein A or His-tag Ni-NTA) yields high-purity separation in a single step.',
  },
  {
    id: 'bt-5',
    branchKey: 'BT',
    topic: 'Bioinformatics',
    question: 'Which widely used bioinformatics tool searches query nucleotide or protein sequences against curated sequence databases?',
    options: ['AutoCAD', 'BLAST', 'SPICE', 'STAAD.Pro'],
    correctIndex: 1,
    explanation: 'BLAST (Basic Local Alignment Search Tool) identifies regions of local similarity between biological sequences.',
  },

  // Robotics & Mechatronics
  {
    id: 'rme-1',
    branchKey: 'RME',
    topic: 'Robot Kinematics',
    question: 'Computing end-effector pose (position and orientation) from known joint angles is called:',
    options: ['Inverse Dynamics', 'Forward Kinematics', 'Jacobian Singularity', 'SLAM'],
    correctIndex: 1,
    explanation: 'Forward kinematics maps joint space coordinates θ to Cartesian end-effector pose; inverse kinematics does the reverse.',
  },
  {
    id: 'rme-2',
    branchKey: 'RME',
    topic: 'ROS 2 Middleware',
    question: 'In ROS 2, which communication pattern is best suited for continuous streaming of LiDAR or camera sensor frames?',
    options: ['Publish / Subscribe Topics', 'One-time Shell Scripts', 'SMTP Emails', 'Static HTML Files'],
    correctIndex: 0,
    explanation: 'Topics implement asynchronous many-to-many pub/sub messaging ideal for periodic sensor streams.',
  },
  {
    id: 'rme-3',
    branchKey: 'RME',
    topic: 'Autonomy',
    question: 'What does SLAM stand for in mobile robotics?',
    options: [
      'Simultaneous Localization and Mapping',
      'Single Linear Actuator Mechanism',
      'Standardized Logic Array Memory',
      'Static Laser Angle Modulation',
    ],
    correctIndex: 0,
    explanation: 'SLAM builds a map of an unknown environment while simultaneously tracking the robot position inside it.',
  },
  {
    id: 'rme-4',
    branchKey: 'RME',
    topic: 'Actuators',
    question: 'Which motor offers closed-loop high-precision torque, velocity, and position control via feedback encoders?',
    options: ['Unregulated AC fan motor', 'Servo motor', 'Manual hand crank', 'Solenoid valve'],
    correctIndex: 1,
    explanation: 'Servo systems pair motor drives with rotary encoders for accurate closed-loop motion.',
  },
  {
    id: 'rme-5',
    branchKey: 'RME',
    topic: 'Sensors',
    question: 'Why are IMU accelerometers and gyroscopes often fused with a Kalman or complementary filter?',
    options: [
      'Gyros drift slowly over time while accelerometers are noisy under vibration; fusion gets accurate short- and long-term tilt',
      'To erase battery readings',
      'To disable motor PWM',
      'To increase wheel slip',
    ],
    correctIndex: 0,
    explanation: 'Sensor fusion combines complementary strengths—short-term gyro smoothness and long-term gravity reference.',
  },
];

// Helper to ensure EVERY engineering branch, PUC, and Degree selection has a full test set
export function getQuestionsForBranch(branchKey: string, count = 5): MockQuestion[] {
  const direct = MOCK_TEST_BANK.filter((q) => q.branchKey === branchKey);
  if (direct.length >= count) {
    return direct.slice(0, count);
  }

  // Fallback curated technical questions mapped cleanly for closely related tracks (AU->ME, IPE->ME, ICE->EEE/ECE, MME/MPE->ME/CHE, PUC/Degree->CSE/DS)
  const fallbackMap: Record<string, string[]> = {
    AU: ['ME', 'EEE'],
    IPE: ['ME', 'DS'],
    ICE: ['EEE', 'ECE'],
    MME: ['ME', 'CHE'],
    MPE: ['CE', 'CHE'],
    PCMC: ['CSE', 'ECE'],
    PCMB: ['BT', 'CHE'],
    PCMS: ['DS', 'CSE'],
    Commerce: ['DS', 'ISE'],
    Arts: ['ISE', 'DS'],
    'B.Sc / Science': ['DS', 'BT'],
    'BCA / Computing': ['CSE', 'ISE'],
    'B.Com / BBA': ['DS', 'ISE'],
    'BA / Humanities': ['ISE', 'CSB'],
  };

  const relatedKeys = fallbackMap[branchKey] || ['CSE', 'AIML', 'ME'];
  const pool = [...direct];
  for (const rk of relatedKeys) {
    for (const q of MOCK_TEST_BANK) {
      if (q.branchKey === rk && !pool.some((item) => item.id === q.id)) {
        pool.push({ ...q, branchKey });
      }
      if (pool.length >= count) break;
    }
    if (pool.length >= count) break;
  }

  if (pool.length < count) {
    for (const q of MOCK_TEST_BANK) {
      if (!pool.some((item) => item.id === q.id)) {
        pool.push({ ...q, branchKey });
      }
      if (pool.length >= count) break;
    }
  }

  return pool.slice(0, count);
}
