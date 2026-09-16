import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import {
    Container, Box, Typography, TextField, Button,
    Grid, Paper, Tabs, Tab, CircularProgress, Alert, LinearProgress
} from '@mui/material';
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import DownloadIcon from '@mui/icons-material/Download';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

const BACKEND_URL = 'https://influencing-style-assessment-backend.onrender.com/api/submit-influencing';

// --- THEME (unchanged) ---
let theme = createTheme({
    palette: {
        primary:    { main: '#F57C00', light: 'rgba(245, 124, 0, 0.08)' },
        secondary:  { main: '#B31b1b' },
        text:       { primary: '#2c3e50', secondary: '#34495e' },
        background: { default: '#f8f9fa', paper: '#FFFFFF' },
        action:     { hover: 'rgba(245, 124, 0, 0.04)' },
    },
    typography: {
        fontFamily: 'sans-serif',
        h1: { fontWeight: 700, color: '#B31b1b', textAlign: 'center', fontSize: '2.5rem', lineHeight: 1.2, wordBreak: 'break-word' },
        h2: { fontWeight: 600, color: '#B31b1b', textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem', wordBreak: 'break-word' },
        h5: { color: '#F57C00', fontWeight: 600, borderBottom: '2px solid #F57C00', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.25rem' },
    },
});
theme = responsiveFontSizes(theme);

const containerStyles = {
    padding: { xs: 2, md: 4 },
    margin: '2rem auto',
    borderRadius: '15px',
    backgroundColor: 'background.paper',
    border: '1px solid #e9ecef',
    maxWidth: '800px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
};

// --- DATA ---

const questions = [
    "I prefer to get straight to the point and state my position clearly.",
    "I gather lots of data and use facts to support my arguments.",
    "I focus on building relationships and finding common ground first.",
    "I tell stories and use examples to make my point emotionally compelling.",
    "I am comfortable challenging others if I believe they are wrong.",
    "I prefer to involve others in the decision-making process.",
    "I use data, metrics, and ROI to convince people.",
    "I adapt my communication style based on who I am talking to.",
    "I focus on the potential impact and vision rather than details.",
    "I prioritize maintaining harmony and avoiding conflict.",
    "I am driven by results and getting things done quickly.",
    "I invest time understanding other people's needs and concerns.",
    "I am confident in my expertise and rely on it to influence others.",
    "I use humor and personal warmth to connect with people.",
    "I am willing to compromise if it means reaching agreement.",
    "I prefer logical arguments over emotional appeals.",
];

const STYLE_INDICES = {
    Driver:     [0, 4, 10, 12],
    Analyst:    [1, 6, 15],
    Connector:  [2, 5, 7, 11, 14],
    Inspirer:   [3, 8, 13],
    Stabilizer: [9],
};

const STYLE_MAXES = { Driver: 20, Analyst: 15, Connector: 25, Inspirer: 15, Stabilizer: 5 };

const styleDescriptions = {
    Driver: {
        title:    'The Driver',
        tagline:  'Direct · Results-Oriented · Commanding',
        approach: 'You influence through confidence, expertise, and clear vision. When you walk into a room with a position, people feel it.',
        strengths: [
            'Takes charge and drives action',
            'Decisive and confident under pressure',
            'Gets results quickly',
            'Inspires through bold vision',
        ],
        development: [
            "May steamroll others' perspectives",
            'Can come across as aggressive or domineering',
            'May miss important details in pursuit of speed',
        ],
        bestWhen: 'Setting direction, making tough calls, rallying teams around urgent challenges.',
        bestWhenExpanded: [
            {
                scenario: 'Setting Direction',
                detail: 'When teams are stuck in analysis paralysis or pulled in too many directions, you cut through the noise. Your willingness to commit to a clear position — even under uncertainty — gives others something concrete to rally behind. People often do not need the perfect answer as much as they need someone with the conviction to move forward. That is where you thrive.',
            },
            {
                scenario: 'Making Tough Calls',
                detail: 'Unpopular but necessary decisions are where most leaders hesitate. You do not. Your ability to weigh the situation quickly, absorb pushback, and hold your position makes you invaluable in moments where indecision has a real cost. You help organizations move past deadlock and into action — and people respect that even when they disagree.',
            },
            {
                scenario: 'Rallying Teams Around Urgent Challenges',
                detail: 'Under time pressure or in a crisis, your energy and directness become a competitive advantage. You create the sense of urgency the moment demands, and your confidence is contagious — when you believe something is achievable, others begin to believe it too. Your presence alone can shift a team\'s momentum from stuck to moving.',
            },
        ],
    },
    Analyst: {
        title:    'The Analyst',
        tagline:  'Data-Driven · Logical · Thorough',
        approach: 'You influence through facts, evidence, and clear reasoning. Your arguments are hard to refute because they are built on solid ground.',
        strengths: [
            'Builds credible, evidence-based arguments',
            'Thorough in research and preparation',
            'Reduces risk through careful analysis',
            'Respected for depth of expertise',
        ],
        development: [
            'Can overwhelm others with too much data',
            'May come across as cold or detached',
            'Can delay action while still gathering information',
        ],
        bestWhen: 'Building buy-in for major decisions, navigating technical challenges, risk mitigation.',
        bestWhenExpanded: [
            {
                scenario: 'Building Buy-in for Major Decisions',
                detail: 'When the stakes are high and stakeholders are skeptical, data is the most powerful form of persuasion. Your methodical approach to constructing evidence-based arguments makes your case difficult to refute. You do not just have an opinion — you have a position that has been tested against reality, and people trust that distinction.',
            },
            {
                scenario: 'Navigating Technical Challenges',
                detail: 'Complex problems that require deep research, systematic diagnosis, and careful reasoning are your natural terrain. Where others may jump to solutions, you map the problem first. That discipline reduces the risk of costly mistakes and gives the team confidence that the path forward has been carefully thought through, not improvised.',
            },
            {
                scenario: 'Risk Mitigation',
                detail: 'Before a major investment, change initiative, or strategic commitment, organizations need someone to stress-test the thinking. You identify blind spots others overlook, challenge assumptions that have not been examined, and flag dependencies that could derail execution. Your influence here is protective — it saves organizations from avoidable and expensive failures.',
            },
        ],
    },
    Connector: {
        title:    'The Connector',
        tagline:  'Collaborative · Inclusive · Empathetic',
        approach: 'You influence through relationships, understanding, and consensus-building. People follow you because they feel genuinely heard.',
        strengths: [
            'Creates psychological safety and trust',
            'Listens deeply and validates others',
            'Builds broad coalition and buy-in',
            'Navigates complex relationships gracefully',
        ],
        development: [
            'May be seen as indecisive',
            'Can prioritize harmony over necessary change',
            'Consensus-building can slow down progress',
        ],
        bestWhen: 'Change management, team building, cross-functional projects, conflict resolution.',
        bestWhenExpanded: [
            {
                scenario: 'Change Management',
                detail: 'Organizational change creates fear, resistance, and uncertainty — all of which are human, not logical, problems. You address the human side of change. By taking time to listen, validate concerns, and build genuine understanding, you create the psychological safety people need before they can embrace something new. Without that safety, even the best strategy meets a wall of quiet resistance.',
            },
            {
                scenario: 'Team Building',
                detail: 'High-performing teams are built on trust, and trust is built through the kind of intentional relationship investment that comes naturally to you. You notice when someone is disengaged, you make space for quieter voices, and you help people feel that their contribution genuinely matters. These are the conditions in which people bring their best work to the table.',
            },
            {
                scenario: 'Cross-Functional Projects',
                detail: 'When influence must extend beyond formal authority — across departments, hierarchies, or organizational silos — relationships become your currency. You excel here because you invest in relationships before you need them. By the time collaboration is required, you have already built the bridges that others are still trying to construct.',
            },
            {
                scenario: 'Conflict Resolution',
                detail: 'When two parties are entrenched, they usually need to feel heard before they can move toward resolution. You create that opening by genuinely validating all perspectives — not as a tactic, but because you actually care about understanding each side. That sincerity de-escalates tension and opens the door to the kind of productive dialogue that produces durable agreements.',
            },
        ],
    },
    Inspirer: {
        title:    'The Inspirer',
        tagline:  'Visionary · Energetic · Emotional',
        approach: 'You influence through stories, passion, and compelling possibilities. You make people feel something — and feeling leads to action.',
        strengths: [
            'Creates excitement and forward momentum',
            'Tells compelling stories and paints vivid pictures',
            'Inspires genuine emotional commitment',
            'Charismatic and memorable',
        ],
        development: [
            'May lack credible supporting data',
            'Can seem unrealistic or overly optimistic',
            'May not follow through on details',
        ],
        bestWhen: 'Launching new initiatives, selling vision, motivating change.',
        bestWhenExpanded: [
            {
                scenario: 'Launching New Initiatives',
                detail: 'People do not commit to ideas — they commit to feelings. Before anyone invests time, energy, or political capital in something new, they need to feel that it is possible and worth pursuing. You create that feeling. Your ability to paint a vivid picture of what could be makes the new feel real, exciting, and worth the risk of stepping away from the familiar.',
            },
            {
                scenario: 'Selling Vision',
                detail: 'Whether you are presenting to senior leadership, pitching to customers, or aligning a team around a new direction, the ability to make the future feel tangible and desirable is a rare and powerful skill. You make vision visceral — not just intellectually understandable but emotionally compelling. People leave your presentations feeling something, and that emotional charge is what converts interest into action.',
            },
            {
                scenario: 'Motivating Change',
                detail: 'Meaningful change requires people to leave their comfort zones, and logic alone is rarely sufficient motivation for that. You provide the emotional fuel. By connecting change to something people care about — their values, their purpose, or a vision of who they could become — you help them move past resistance and step into the unknown with genuine commitment rather than grudging compliance.',
            },
        ],
    },
    Stabilizer: {
        title:    'The Stabilizer',
        tagline:  'Cautious · Diplomatic · Conflict-Averse',
        approach: 'You influence by seeking agreement and preserving relationships. In turbulent moments, your steadiness becomes an anchor.',
        strengths: [
            'Creates calm and stability in tense situations',
            'Avoids unnecessary conflict',
            'Builds loyalty through consistency',
            'Thoughtful and considerate',
        ],
        development: [
            'May avoid necessary difficult conversations',
            'Can be perceived as passive',
            'May struggle to hold firm on important issues',
        ],
        bestWhen: 'Maintaining team cohesion, sustaining momentum, supporting others through stress.',
        bestWhenExpanded: [
            {
                scenario: 'Maintaining Team Cohesion',
                detail: 'When teams are under prolonged stress, small tensions can fracture relationships and derail collaboration. You act as social glue. Your ability to remain calm, avoid taking sides, and keep interactions respectful prevents minor friction from becoming lasting damage. Teams with a Stabilizer in them tend to hold together during difficult stretches when others would begin to fragment.',
            },
            {
                scenario: 'Sustaining Momentum',
                detail: 'Long projects lose energy — the initial excitement fades, obstacles accumulate, and motivation dips. You help sustain forward movement without injecting drama or creating new pressure. Your consistency and steadiness keep things progressing at a maintainable pace, which often matters more than sporadic bursts of high-intensity effort that lead to burnout.',
            },
            {
                scenario: 'Supporting Others Through Stress',
                detail: 'During difficult periods — organizational restructuring, high-pressure delivery cycles, interpersonal conflict — people need a space to regroup. Your diplomatic nature and discomfort with conflict mean you rarely add to the noise. Instead, you create pockets of calm where colleagues can process what they are experiencing, recover their footing, and re-engage with the work ahead.',
            },
        ],
    },
};

const CHART_COLORS = {
    Driver: '#FF6B6B', Analyst: '#45B7D1', Connector: '#4ECDC4',
    Inspirer: '#FFA07A', Stabilizer: '#A78BFA',
};

// --- PDF GENERATOR ---

const generateReport = async (userInfo, results, styleDescs, styleIndices, styleMxs) => {
    // Fetch logo as base64 and capture natural dimensions for correct aspect ratio
    let logoBase64 = null;
    let logoAspect = 3; // fallback
    try {
        const res  = await fetch('/logo.png');
        const blob = await res.blob();
        logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        await new Promise((resolve) => {
            const img = new Image();
            img.onload  = () => { logoAspect = img.naturalWidth / img.naturalHeight; resolve(); };
            img.onerror = resolve;
            img.src = logoBase64;
        });
    } catch (e) {
        console.warn('Logo could not be loaded:', e);
    }

    const { percentages, rawScores, dominantStyles } = results;
    const primaryStyle = dominantStyles[0];
    const info = styleDescs[primaryStyle];

    const doc  = new jsPDF('p', 'mm', 'a4');
    const pW   = 210, pH = 297, m = 20, cW = 170;
    let y = 0;

    // Palette
    const pal = {
        carnelian: [166, 61,  47],
        orange:    [245, 124,  0],
        dark:      [ 44,  62, 80],
        gray:      [107, 114, 128],
        lgray:     [248, 249, 250],
        white:     [255, 255, 255],
        border:    [220, 215, 210],
    };

    const tc = (k)         => { const [r,g,b] = pal[k]; doc.setTextColor(r,g,b); };
    const fc = (k)         => { const [r,g,b] = pal[k]; doc.setFillColor(r,g,b); };
    const dc = (k)         => { const [r,g,b] = pal[k]; doc.setDrawColor(r,g,b); };
    const fca = (arr)      => { doc.setFillColor(...arr); };

    const newPage = () => { doc.addPage(); y = m; };
    const chk     = (h)   => { if (y + h > pH - m) newPage(); };

    const pageStripe = (label) => {
        fc('carnelian'); doc.rect(0, 0, pW, 12, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(8); tc('white');
        doc.text(label, m, 8);
        y = 22;
    };

    const sectionHeader = (title) => {
        chk(14);
        fc('orange'); doc.rect(m, y - 4, cW, 9, 'F');
        doc.setFont('helvetica','bold'); doc.setFontSize(10); tc('white');
        doc.text(title.toUpperCase(), m + 4, y + 1);
        tc('dark'); y += 12;
    };

    const para = (text, maxW = cW, lh = 5.5) => {
        doc.setFont('helvetica','normal'); doc.setFontSize(10); tc('dark');
        const lines = doc.splitTextToSize(text, maxW);
        lines.forEach(line => { chk(lh + 1); doc.text(line, m, y); y += lh; });
        y += 2;
    };

    const bullets = (items, dotKey = 'carnelian') => {
        items.forEach(item => {
            const lines = doc.splitTextToSize(item, cW - 8);
            chk(lines.length * 5.5 + 3);
            fc(dotKey); doc.rect(m + 1, y - 2.5, 2, 2, 'F');
            doc.setFont('helvetica','normal'); doc.setFontSize(10); tc('dark');
            lines.forEach((line, li) => doc.text(line, m + 6, y + li * 5.5));
            y += lines.length * 5.5 + 1.5;
        });
        y += 2;
    };

    // ── PAGE 1: Cover + Summary ──────────────────────────────────────────────────

    fc('carnelian'); doc.rect(0, 0, pW, 48, 'F');
    // Decorative circle
    doc.setFillColor(180, 70, 55); doc.ellipse(190, 12, 28, 28, 'F');

    doc.setFont('helvetica','bold'); doc.setFontSize(20); tc('white');
    doc.text('INFLUENCING STYLE ASSESSMENT', pW / 2, 20, { align: 'center' });
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text('Personal Development Report', pW / 2, 30, { align: 'center' });

    y = 54;
    let logoEndY = y;

    // Logo — right-aligned, height derived from natural aspect ratio
    if (logoBase64) {
        const logoW = 38;
        const logoH = logoW / logoAspect;
        doc.addImage(logoBase64, 'PNG', pW - m - logoW, y, logoW, logoH);
        logoEndY = y + logoH + 5; // 5mm padding below logo
    }
    y = 64;

    // Participant info (left column, runs in parallel with logo on right)
    doc.setFont('helvetica','bold'); doc.setFontSize(9); tc('gray');
    doc.text('PREPARED FOR', m, y); y += 7;

    doc.setFont('helvetica','bold'); doc.setFontSize(18); tc('dark');
    doc.text(userInfo.name, m, y); y += 7;

    doc.setFont('helvetica','normal'); doc.setFontSize(11); tc('gray');
    doc.text(userInfo.organization, m, y); y += 5;
    doc.text(
        `Assessment Date: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`,
        m, y
    ); y += 10;

    // Divider goes below whichever ends lower — text or logo
    y = Math.max(y, logoEndY);
    dc('border'); doc.setLineWidth(0.4); doc.line(m, y, m + cW, y); y += 16;

    // Primary style (pushed down)
    doc.setFont('helvetica','bold'); doc.setFontSize(9); tc('gray');
    doc.text('YOUR PRIMARY INFLUENCING STYLE', m, y); y += 8;

    doc.setFont('helvetica','bold'); doc.setFontSize(26); tc('carnelian');
    doc.text(info.title, m, y); y += 8;

    doc.setFont('helvetica','italic'); doc.setFontSize(11); tc('gray');
    doc.text(info.tagline, m, y); y += 8;

    doc.setFont('helvetica','normal'); doc.setFontSize(10); tc('dark');
    const apLines = doc.splitTextToSize(info.approach, cW);
    apLines.forEach(l => { doc.text(l, m, y); y += 5.5; });
    y += 8;

    // Score Breakdown table
    sectionHeader('Style Breakdown');

    const nW = 40, sW = 20, mxW = 20, pW2 = 18;
    const barX  = m + nW + sW + mxW + pW2 + 4;
    const barMW = pW - m - barX;

    doc.setFont('helvetica','bold'); doc.setFontSize(8); tc('gray');
    doc.text('Style',       m, y);
    doc.text('Score',       m + nW, y);
    doc.text('Max',         m + nW + sW, y);
    doc.text('%',           m + nW + sW + mxW, y);
    doc.text('Visual',      barX, y);
    y += 6;

    Object.keys(styleIndices).forEach(style => {
        chk(10);
        const pct       = percentages[style];
        const isPrimary = dominantStyles.includes(style);

        doc.setFont('helvetica', isPrimary ? 'bold' : 'normal');
        doc.setFontSize(9);
        isPrimary ? tc('carnelian') : tc('dark');
        doc.text(styleDescs[style].title, m, y);

        tc('dark'); doc.setFont('helvetica','normal');
        doc.text(`${rawScores[style]}`,  m + nW, y);
        doc.text(`${styleMxs[style]}`,   m + nW + sW, y);
        doc.text(`${pct}%`,              m + nW + sW + mxW, y);

        // Bar
        doc.setFillColor(230, 225, 218);
        doc.rect(barX, y - 3.5, barMW, 5, 'F');
        fca(isPrimary ? pal.carnelian : [200, 190, 184]);
        doc.rect(barX, y - 3.5, (pct / 100) * barMW, 5, 'F');

        y += 9;
    });

    // ── PAGE 2: Deep Dive ────────────────────────────────────────────────────────

    doc.addPage();
    pageStripe(`${info.title.toUpperCase()} — IN DEPTH`);

    sectionHeader('Strengths');
    bullets(info.strengths, 'carnelian');

    sectionHeader('Development Areas');
    bullets(info.development, 'orange');

    sectionHeader('Best When');
    para(
        'Understanding when your style has the most impact helps you lead more intentionally. ' +
        'Each scenario below describes a real-world context where your influencing approach adds the most value — and explains why.'
    );

    info.bestWhenExpanded.forEach(({ scenario, detail }) => {
        chk(24);

        doc.setFont('helvetica','bold'); doc.setFontSize(11); tc('carnelian');
        doc.text(scenario, m, y); y += 6;

        doc.setFont('helvetica','normal'); doc.setFontSize(10); tc('dark');
        const lines = doc.splitTextToSize(detail, cW);
        lines.forEach(line => { chk(6); doc.text(line, m, y); y += 5.5; });
        y += 5;
    });

    // ── PAGE 3: Scoring + Reflection ─────────────────────────────────────────────

    doc.addPage();
    pageStripe('HOW SCORING WORKS');

    sectionHeader('About This Assessment');
    para(
        'This assessment asked you to rate 16 statements on a scale of 1 to 5, where 1 = Strongly Disagree ' +
        'and 5 = Strongly Agree. Each statement maps to one of five influencing styles. Your raw score for each style ' +
        'is the sum of your ratings on its associated questions. Because each style has a different number of questions, ' +
        'scores are converted to a percentage of the maximum possible score so they can be compared fairly.'
    );
    y += 2;

    sectionHeader('Question-to-Style Mapping');

    const tc0 = m, tc1 = m + 36, tc2 = m + 96, tc3 = m + 116, tc4 = m + 136;
    const theads = ['Style', 'Questions', 'Your Score', 'Max', '% Score'];

    fc('lgray'); doc.rect(m, y - 4, cW, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5); tc('dark');
    [tc0, tc1, tc2, tc3, tc4].forEach((x, i) => doc.text(theads[i], x + 1, y));
    y += 6;

    dc('border'); doc.setLineWidth(0.25);
    Object.keys(styleIndices).forEach((style, idx) => {
        chk(10);
        if (idx % 2 === 0) { doc.setFillColor(252,252,252); doc.rect(m, y-4, cW, 8, 'F'); }
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); tc('dark');
        const qNums = styleIndices[style].map(i => `Q${i + 1}`).join(', ');
        [
            styleDescs[style].title,
            qNums,
            String(rawScores[style]),
            String(styleMxs[style]),
            `${percentages[style]}%`,
        ].forEach((val, i) => doc.text(val, [tc0, tc1, tc2, tc3, tc4][i] + 1, y));
        doc.line(m, y + 3, m + cW, y + 3);
        y += 8;
    });
    y += 8;

    sectionHeader('Score Interpretation');
    [
        ['80 – 100%', 'This style is very dominant in how you influence others. It is your most natural mode.'],
        ['60 – 79%',  'This style is a strong secondary tendency you regularly draw on, often without thinking.'],
        ['40 – 59%',  'This style is present but not your go-to approach. You use it selectively.'],
        ['Below 40%', 'This style is underdeveloped. It likely requires conscious effort and practice to access.'],
    ].forEach(([range, meaning]) => {
        chk(10);
        doc.setFont('helvetica','bold'); doc.setFontSize(9); tc('carnelian');
        doc.text(range, m, y);
        doc.setFont('helvetica','normal'); tc('dark');
        const mls = doc.splitTextToSize(meaning, cW - 34);
        mls.forEach((line, li) => doc.text(line, m + 32, y + li * 5));
        y += Math.max(mls.length * 5, 6) + 2;
    });
    y += 6;

    // Ensure all 4 reflection questions land on the same page
    chk(14 + 4 * 28);
    sectionHeader('Reflection Questions');
    [
        'Which style feels most natural to you? When do you use it best?',
        'Which style do you use least? What would it take to develop it?',
        'Think of someone you find very persuasive. Which style(s) do they use?',
        'What is one situation where switching styles would make you more effective?',
    ].forEach((q, i) => {
        chk(26);
        doc.setFont('helvetica','bold'); doc.setFontSize(10); tc('dark');
        const qls = doc.splitTextToSize(`${i + 1}.  ${q}`, cW);
        qls.forEach(line => { doc.text(line, m, y); y += 5.5; });
        y += 2;
        dc('border'); doc.setLineWidth(0.3);
        for (let l = 0; l < 2; l++) doc.line(m + 4, y + l * 7, m + cW, y + l * 7);
        y += 18;
    });

    // ── Footer on every page ─────────────────────────────────────────────────────

    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
        doc.setPage(p);
        dc('border'); doc.setLineWidth(0.3);
        doc.line(m, pH - 12, pW - m, pH - 12);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); tc('gray');
        doc.text(`${userInfo.name}  ·  ${userInfo.organization}  ·  Influencing Style Assessment`, m, pH - 7);
        doc.text(`Page ${p} of ${total}`, pW - m, pH - 7, { align: 'right' });
    }

    doc.save(`Influencing_Style_Report_${userInfo.name.replace(/\s+/g, '_')}.pdf`);
};

// --- MAIN APP ---

function App() {
    const [step, setStep]           = useState('welcome');
    const [userInfo, setUserInfo]   = useState({ name: '', organization: '' });
    const [responses, setResponses] = useState(new Array(questions.length).fill(null));
    const [results, setResults]     = useState(null);
    const [error, setError]         = useState('');
    const [tabIndex, setTabIndex]   = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (step === 'assessment' || step === 'results') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step]);

    const handleStart = () => {
        if (userInfo.name && userInfo.organization) {
            setError(''); setStep('assessment');
        } else {
            setError('Please fill out both your name and organization.');
        }
    };

    const handleSubmit = async () => {
        if (responses.includes(null)) {
            setError('Please answer all questions before submitting.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        // Compute scores immediately so results always show
        const rawScores = {}, percentages = {};
        for (const [style, indices] of Object.entries(STYLE_INDICES)) {
            rawScores[style]   = indices.reduce((sum, idx) => sum + (responses[idx] || 0), 0);
            percentages[style] = Math.round((rawScores[style] / STYLE_MAXES[style]) * 100);
        }
        const maxPct         = Math.max(...Object.values(percentages));
        const dominantStyles = Object.keys(percentages).filter(s => percentages[s] === maxPct);

        setResults({ rawScores, percentages, dominantStyles });
        setStep('results');
        setIsSubmitting(false);

        // Backend fire-and-forget
        try {
            await axios.post(BACKEND_URL, { name: userInfo.name, organization: userInfo.organization, responses });
        } catch (err) {
            console.warn('Backend submission failed (results still shown):', err.message);
        }
    };

    const handleResponseChange = (questionIndex, value) => {
        const newResponses = [...responses];
        newResponses[questionIndex] = value;
        setResponses(newResponses);
    };

    // ── Welcome ──────────────────────────────────────────────────────────────────

    const renderWelcome = () => (
        <Paper elevation={3} sx={containerStyles}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
                <img src="/logo.png" alt="Carnelian Logo" style={{ width: '120px', height: 'auto' }} />
                <Typography variant="h1">Influencing Style Assessment</Typography>
            </Box>
            <Typography variant="h5" align="center" color="text.secondary"
                sx={{ mb: 4, fontWeight: 'normal', borderBottom: 'none', color: 'text.secondary' }}>
                Discover your natural influence approach. 16 questions · 5 minutes.
            </Typography>
            <Box sx={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField fullWidth label="Your Name" variant="outlined"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} />
                <TextField fullWidth label="Organization" variant="outlined"
                    value={userInfo.organization}
                    onChange={(e) => setUserInfo({ ...userInfo, organization: e.target.value })} />
                {error && <Alert severity="error">{error}</Alert>}
                <Button variant="contained" size="large" color="primary" onClick={handleStart}
                    disabled={!userInfo.name || !userInfo.organization}
                    startIcon={<RocketLaunchIcon />} sx={{ mt: 2, py: 1.5 }}>
                    Begin Assessment
                </Button>
            </Box>
        </Paper>
    );

    // ── Assessment ───────────────────────────────────────────────────────────────

    const renderAssessment = () => {
        const answeredCount = responses.filter(r => r !== null).length;
        const progress      = (answeredCount / questions.length) * 100;

        return (
            <Paper sx={containerStyles}>
                <Box sx={{ mb: 3, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, pt: 2, pb: 1 }}>
                    <Typography variant="h2">The Assessment</Typography>
                    <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 1 }}>
                        {answeredCount} of {questions.length} questions answered
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: '8px', borderRadius: '4px' }} />
                </Box>

                {questions.map((text, i) => {
                    const selected = responses[i];
                    return (
                        <Box key={i} sx={{ mb: 3, borderTop: '1px solid #eee', pt: 3 }}>
                            <Typography sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary', fontSize: '1.05rem' }}>
                                {`Q${i + 1}. ${text}`}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                <Typography variant="caption" color="text.secondary">Strongly Disagree</Typography>
                                <Typography variant="caption" color="text.secondary">Strongly Agree</Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: { xs: 0.75, md: 1 } }}>
                                {[1, 2, 3, 4, 5].map((val) => {
                                    const isSelected = selected === val;
                                    return (
                                        <Box key={val} onClick={() => handleResponseChange(i, val)} sx={{
                                            flex: 1,
                                            py: { xs: 1.5, md: 2 },
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            borderColor: isSelected ? 'primary.main' : '#ddd',
                                            backgroundColor: isSelected ? 'primary.light' : 'transparent',
                                            borderRadius: 2,
                                            transition: 'all 0.12s',
                                            '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' },
                                            WebkitTapHighlightColor: 'transparent',
                                            userSelect: 'none',
                                        }}>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                fontSize: { xs: '1.1rem', md: '1.25rem' },
                                                color: isSelected ? 'primary.main' : 'text.secondary',
                                                lineHeight: 1,
                                            }}>
                                                {val}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button variant="contained" size="large" color="primary"
                        onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit & View Results'}
                    </Button>
                </Box>
            </Paper>
        );
    };

    // ── Results ──────────────────────────────────────────────────────────────────

    const renderResults = () => {
        if (!results) return <CircularProgress />;

        const { percentages, dominantStyles } = results;
        const styleKeys   = Object.keys(STYLE_INDICES);
        const chartLabels = styleKeys.map(k => styleDescriptions[k].title);
        const chartValues = styleKeys.map(k => percentages[k]);
        const chartColors = styleKeys.map(k =>
            dominantStyles.includes(k) ? CHART_COLORS[k] : 'rgba(200,190,184,0.6)'
        );

        const renderStyleDetails = (style) => {
            const info = styleDescriptions[style];
            return (
                <Box sx={{ mt: 2 }}>
                    <Paper elevation={2} sx={{ p: 2, my: 2, backgroundColor: 'rgba(245, 124, 0, 0.1)' }}>
                        <Typography variant="body1" align="center" fontStyle="italic">{info.tagline}</Typography>
                        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>{info.approach}</Typography>
                    </Paper>
                    <Grid container spacing={{ xs: 2, md: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5">Strengths</Typography>
                            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                                {info.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5">Development Areas</Typography>
                            <ul style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
                                {info.development.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h5">Best When</Typography>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'rgba(245,124,0,0.1)', borderLeft: '4px solid #F57C00' }}>
                            <Typography variant="body1">{info.bestWhen}</Typography>
                        </Paper>
                    </Box>
                </Box>
            );
        };

        return (
            <Paper sx={containerStyles}>
                <Typography variant="h2">Your Results</Typography>

                <Plot
                    data={[{
                        type: 'bar',
                        x: chartLabels,
                        y: chartValues,
                        marker: { color: chartColors },
                        text: chartValues.map(v => `${v}%`),
                        textposition: 'outside',
                        hovertemplate: '%{x}: %{y}%<extra></extra>',
                    }]}
                    layout={{
                        height: 320,
                        margin: { l: 30, r: 20, t: 20, b: 70 },
                        yaxis: { range: [0, 115], ticksuffix: '%', gridcolor: '#eee' },
                        xaxis: { tickangle: -20 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor:  'rgba(0,0,0,0)',
                        font: { color: theme.palette.text.primary },
                    }}
                    style={{ width: '100%' }}
                    config={{ responsive: true, displayModeBar: false }}
                />

                <Typography variant="h4" align="center" color="secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
                    {dominantStyles.length > 1
                        ? 'You have a blend of styles!'
                        : `Your Primary Style: ${styleDescriptions[dominantStyles[0]].title}`}
                </Typography>

                {dominantStyles.length > 1 ? (
                    <Box sx={{ width: '100%', mt: 3 }}>
                        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} centered>
                            {dominantStyles.map(s => (
                                <Tab key={s} label={styleDescriptions[s].title} />
                            ))}
                        </Tabs>
                        {renderStyleDetails(dominantStyles[tabIndex])}
                    </Box>
                ) : (
                    <Box sx={{ mt: 3 }}>{renderStyleDetails(dominantStyles[0])}</Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<DownloadIcon />}
                        onClick={() => generateReport(userInfo, results, styleDescriptions, STYLE_INDICES, STYLE_MAXES)}
                        sx={{ py: 1.5, px: 4 }}
                    >
                        Download Report
                    </Button>
                </Box>
            </Paper>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
                {step === 'welcome'    && renderWelcome()}
                {step === 'assessment' && renderAssessment()}
                {step === 'results'    && renderResults()}
            </Container>
        </ThemeProvider>
    );
}

export default App;