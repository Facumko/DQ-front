import "./ProgressBar.css"


function ProgressBar({ steps, currentStep }) {
  return (
    <div className="progress-bar">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`progress-step ${index + 1 === currentStep ? "active" : ""} ${
            index + 1 < currentStep ? "completed" : ""
          }`}
        >
          <div className="step-number">{index + 1}</div>
          <div className="step-label">{step}</div>
        </div>
      ))}
    </div>
  )
}


export default ProgressBar