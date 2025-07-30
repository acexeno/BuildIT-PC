import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, Zap, Shield, Cpu, HardDrive } from 'lucide-react'

const CompatibilityChecker = ({ compatibilityStatus, compatibilityScore, compatibilityDetails = {}, selectionProgress = 0 }) => {
  // all the compatibility checks we need to run
  const compatibilityChecks = [
    {
      id: 'cpu_motherboard',
      name: 'CPU & Motherboard',
      description: 'Socket compatibility check',
      status: compatibilityStatus.cpu_motherboard,
      detail: compatibilityDetails.cpu_motherboard,
      icon: <Cpu className="w-5 h-5" />
    },
    {
      id: 'ram_motherboard',
      name: 'RAM & Motherboard',
      description: 'Memory type compatibility',
      status: compatibilityStatus.ram_motherboard,
      detail: compatibilityDetails.ram_motherboard,
      icon: <HardDrive className="w-5 h-5" />
    },
    {
      id: 'psu_power',
      name: 'Power Supply',
      description: 'Adequate power for components',
      status: compatibilityStatus.psu_power,
      detail: compatibilityDetails.psu_power,
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'case_motherboard',
      name: 'Case & Motherboard',
      description: 'Form factor compatibility',
      status: compatibilityStatus.case_motherboard,
      detail: compatibilityDetails.case_motherboard,
      icon: <Shield className="w-5 h-5" />
    }
  ]

  // figure out what color to use for the score
  const getScoreColor = (score) => {
    if (score === 0) return 'text-gray-600'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // figure out what background color to use for the score
  const getScoreBg = (score) => {
    if (score === 0) return 'bg-gray-100'
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  // pick the right icon based on compatibility status
  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="w-6 h-6 text-green-600" />
    if (status === false) return <XCircle className="w-6 h-6 text-red-600" />
    return <Info className="w-6 h-6 text-gray-400" />
  }

  // get the text to show for each status
  const getStatusText = (status) => {
    if (status === true) return 'Compatible'
    if (status === false) return 'Incompatible'
    return 'Not checked'
  }

  // pick the right text color based on status
  const getStatusColor = (status) => {
    if (status === true) return 'text-green-600'
    if (status === false) return 'text-red-600'
    return 'text-gray-500'
  }

  // pick the right background color based on status
  const getStatusBg = (status) => {
    if (status === true) return 'bg-green-50 border-green-200'
    if (status === false) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  // pick the right color for the progress bar
  const getProgressColor = (score) => {
    if (score === 0) return 'bg-gray-400'
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="card">
      {/* header with progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Compatibility Status</h3>
        </div>
        <span className="block text-sm font-medium text-gray-800 mb-2">
          {selectionProgress}% Selected | {compatibilityScore}% Compatible
        </span>
        
        {/* progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(selectionProgress)}`}
            style={{ width: `${selectionProgress}%` }}
          ></div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(compatibilityScore)}`}
            style={{ width: `${compatibilityScore}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600">
          {selectionProgress === 0
            ? "Select components to check compatibility"
            : selectionProgress < 100
            ? `${selectionProgress}% of required components selected`
            : compatibilityScore === 100
            ? "🎉 Perfect! All components are compatible"
            : compatibilityScore > 0
            ? `${compatibilityScore}% of compatibility checks passed`
            : "Compatibility issues detected"
          }
        </p>
      </div>

      {/* Compatibility Checks */}
      <div className="space-y-4 mb-6">
        {compatibilityChecks.map((check) => (
          <div
            key={check.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${getStatusBg(check.status)}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${check.status === true ? 'bg-green-100' : check.status === false ? 'bg-red-100' : 'bg-gray-100'}`}>
                {check.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-lg">{check.name}</h4>
                  {getStatusIcon(check.status)}
                </div>
                <p className="text-sm text-gray-600 mb-1">{check.description}</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                    {getStatusText(check.status)}
                  </span>
                </div>
                {/* Show detail if failed */}
                {check.status === false && check.detail && (
                  <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1 mt-1">
                    <AlertTriangle className="inline w-4 h-4 mr-1 text-orange-500 align-text-bottom" />
                    {check.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compatibility Tips */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">💡 Compatibility Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure CPU socket matches motherboard socket</li>
              <li>• Check RAM type compatibility (DDR4/DDR5)</li>
              <li>• Verify PSU wattage meets component requirements</li>
              <li>• Confirm case supports motherboard form factor</li>
              <li>• Consider aftermarket cooler for better performance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      {compatibilityScore === 100 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">🎉 Perfect Compatibility!</h4>
              <p className="text-sm text-green-800">All components are compatible and ready for assembly.</p>
            </div>
          </div>
        </div>
      )}

      {compatibilityScore > 0 && compatibilityScore < 100 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-900">⚠️ Partial Compatibility</h4>
              <p className="text-sm text-yellow-800">Some components may have compatibility issues. Please review the checks above.</p>
            </div>
          </div>
        </div>
      )}

      {compatibilityScore === 0 && Object.keys(compatibilityStatus).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">❌ Compatibility Issues</h4>
              <p className="text-sm text-red-800">Multiple compatibility issues detected. Please review and adjust your component selection.</p>
            </div>
          </div>
        </div>
      )}

      {compatibilityScore === 0 && Object.keys(compatibilityStatus).length === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-gray-600" />
            <div>
              <h4 className="font-medium text-gray-900">📋 No Components Selected</h4>
              <p className="text-sm text-gray-800">Start building by selecting components to check compatibility.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompatibilityChecker 