import { useEffect, useMemo, useState } from 'react'
import {
  health,
  predictSingle,
  predictBulk,
  compareModels,
  startTraining,
  trainingStatus,
} from './api'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import OverviewCard from './components/OverviewCard'
import StatsGrid from './components/StatsGrid'
import PredictPanel from './components/PredictPanel'
import BulkPanel from './components/BulkPanel'
import ComparePanel from './components/ComparePanel'
import TrainPanel from './components/TrainPanel'
import RecentScansPanel from './components/RecentScansPanel'
import LearningPanel from './components/LearningPanel'

const MODELS = ['RandomForest', 'DecisionTree', 'XGBoost', 'LogisticRegression']
const SECTIONS = ['predict', 'bulk', 'compare', 'learn', 'train', 'history']
const THEME_KEY = 'phishshield-theme'
const SIDEBAR_KEY = 'phishshield-sidebar-collapsed'

function App() {
  const [activeSection, setActiveSection] = useState('predict')
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true')
  const [apiStatus, setApiStatus] = useState('checking...')
  const [error, setError] = useState('')
  const [isLoadingPredict, setIsLoadingPredict] = useState(false)
  const [isLoadingBulk, setIsLoadingBulk] = useState(false)
  const [isLoadingCompare, setIsLoadingCompare] = useState(false)
  const [isLoadingTrainAction, setIsLoadingTrainAction] = useState(false)

  const [url, setUrl] = useState('')
  const [predictModel, setPredictModel] = useState(MODELS[0])
  const [testMode, setTestMode] = useState('single')
  const [predictionResult, setPredictionResult] = useState(null)

  const [bulkText, setBulkText] = useState('')
  const [bulkModel, setBulkModel] = useState(MODELS[0])
  const [bulkResult, setBulkResult] = useState([])

  const [compareResult, setCompareResult] = useState({ results: [], best_model: null })

  const [trainModel, setTrainModel] = useState('RandomForest')
  const [trainState, setTrainState] = useState({ running: false, completed: false, log: '' })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    async function boot() {
      try {
        const response = await health()
        setApiStatus(response.status)
      } catch (err) {
        setApiStatus('offline')
        setError(err.message)
      }
    }

    boot()
  }, [])

  async function handlePredict(event) {
    event.preventDefault()
    setError('')
    setPredictionResult(null)
    setIsLoadingPredict(true)
    try {
      const response = await predictSingle({
        url,
        model: predictModel,
        test_mode: testMode,
      })
      setPredictionResult(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingPredict(false)
    }
  }

  async function handleBulkPredict(event) {
    event.preventDefault()
    setError('')
    setBulkResult([])
    setIsLoadingBulk(true)

    try {
      const urls = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      if (urls.length === 0) {
        throw new Error('Please enter at least one URL for bulk prediction')
      }

      const response = await predictBulk(urls, bulkModel)
      setBulkResult(response.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingBulk(false)
    }
  }

  async function handleCompare() {
    setError('')
    setIsLoadingCompare(true)
    try {
      const response = await compareModels()
      setCompareResult(response)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingCompare(false)
    }
  }

  async function handleStartTraining(event) {
    event.preventDefault()
    setError('')
    setIsLoadingTrainAction(true)
    try {
      await startTraining(trainModel)
      await refreshTrainingStatus()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingTrainAction(false)
    }
  }

  async function refreshTrainingStatus() {
    try {
      const response = await trainingStatus()
      setTrainState(response)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTrainingStatus()
    }, 300000) //TODO : make to 3 seconds

    return () => clearInterval(intervalId)
  }, [])

  const topFeatures = useMemo(() => {
    const features = predictionResult?.shap_explanations?.top_features || []
    return features.slice(0, 5)
  }, [predictionResult])

  const statCards = useMemo(
    () => [
      {
        label: 'API Health',
        value: apiStatus,
        tone: apiStatus === 'ok' ? 'good' : apiStatus === 'checking...' ? 'neutral' : 'danger',
      },
      {
        label: 'Bulk Results',
        value: bulkResult.length,
        tone: 'neutral',
      },
      {
        label: 'Models Compared',
        value: compareResult.results?.length || 0,
        tone: 'neutral',
      },
      {
        label: 'Training Running',
        value: trainState.running ? 'Yes' : 'No',
        tone: trainState.running ? 'warn' : 'neutral',
      },
    ],
    [apiStatus, bulkResult.length, compareResult.results, trainState.running],
  )

  const navItems = [
    { id: 'predict', label: 'Threat Scan', description: 'Single URL deep analysis' },
    { id: 'bulk', label: 'Bulk Analysis', description: 'Batch URL screening' },
    { id: 'compare', label: 'Model Lab', description: 'Metrics and model ranking' },
    { id: 'train', label: 'Training Ops', description: 'Run and monitor retraining' },
    { id: 'history', label: 'Recent Scans', description: 'Latest scan history' },
    { id: 'learn', label: 'Learn', description: 'Model & SHAP explanations' },
  ]

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <Sidebar
        apiStatus={apiStatus}
        navItems={navItems}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        theme={theme}
        setTheme={setTheme}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        modulesCount={SECTIONS.length}
      />

      <main className="main-content">
        <TopBar theme={theme} setTheme={setTheme} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} activeSection={activeSection} />
        {/* <OverviewCard /> */}

        {activeSection !== 'learn' && <StatsGrid statCards={statCards} />}

        {error ? <div className="alert error">{error}</div> : null}

        <PredictPanel
          isActive={activeSection === 'predict'}
          url={url}
          setUrl={setUrl}
          predictModel={predictModel}
          setPredictModel={setPredictModel}
          testMode={testMode}
          setTestMode={setTestMode}
          isLoadingPredict={isLoadingPredict}
          handlePredict={handlePredict}
          MODELS={MODELS}
          predictionResult={predictionResult}
          topFeatures={topFeatures}
        />

        <BulkPanel
          isActive={activeSection === 'bulk'}
          bulkText={bulkText}
          setBulkText={setBulkText}
          bulkModel={bulkModel}
          setBulkModel={setBulkModel}
          isLoadingBulk={isLoadingBulk}
          handleBulkPredict={handleBulkPredict}
          MODELS={MODELS}
          bulkResult={bulkResult}
        />

        <ComparePanel
          isActive={activeSection === 'compare'}
          compareResult={compareResult}
          isLoadingCompare={isLoadingCompare}
          handleCompare={handleCompare}
        />

        <TrainPanel
          isActive={activeSection === 'train'}
          trainModel={trainModel}
          setTrainModel={setTrainModel}
          MODELS={MODELS}
          handleStartTraining={handleStartTraining}
          trainState={trainState}
          isLoadingTrainAction={isLoadingTrainAction}
          refreshTrainingStatus={refreshTrainingStatus}
        />

        <LearningPanel isActive={activeSection === 'learn'} />
        <RecentScansPanel isActive={activeSection === 'history'} />
      </main>
    </div>
  )
}

export default App
