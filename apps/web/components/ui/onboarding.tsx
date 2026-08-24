"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ContextValue = { currentStep: number; totalSteps: number; stepValue: number; setStepValue: (value: number) => void; handleNext: () => void; handleBack: () => void }
const Context = React.createContext<ContextValue | null>(null)
function useOnboarding() { const value = React.useContext(Context); if (!value) throw new Error("useOnboarding must be used inside Onboarding"); return value }

function Onboarding({ totalSteps, maxStepValue = 0, defaultValue = 1, canGoNext = () => true, onComplete, className, children }: { totalSteps: number; maxStepValue?: number; defaultValue?: number; canGoNext?: (step: number, stepValue: number) => boolean; onComplete?: () => void; className?: string; children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = React.useState(defaultValue)
  const [stepValue, setStepValue] = React.useState(0)
  const handleNext = () => { if (!canGoNext(currentStep, stepValue)) return; if (currentStep === totalSteps) onComplete?.(); else { setCurrentStep((value) => value + 1); setStepValue(0) } }
  const handleBack = () => { if (currentStep > 1) { setCurrentStep((value) => value - 1); setStepValue(maxStepValue) } }
  return <Context.Provider value={{ currentStep, totalSteps, stepValue, setStepValue, handleNext, handleBack }}><div className={cn("rounded-2xl border bg-card p-6", className)}>{children}</div></Context.Provider>
}
Onboarding.Step = function Step({ step, children }: { step: number; children: React.ReactNode }) { return useOnboarding().currentStep === step ? <>{children}</> : null }
Onboarding.Header = function Header({ title, description, children }: { title?: string; description?: string; children?: React.ReactNode }) { return <header className="text-center">{children ?? <><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></>}</header> }
Onboarding.StepIndicator = function StepIndicator({ totalSteps = 3 }: { totalSteps?: number }) { const { currentStep } = useOnboarding(); return <div className="mt-4 flex justify-center gap-2" aria-label={`Step ${currentStep} of ${totalSteps}`}>{Array.from({ length: totalSteps }, (_, index) => <span key={index} className={cn("h-1.5 w-8 rounded-full bg-muted", index + 1 <= currentStep && "bg-primary")} />)}</div> }
Onboarding.Navigation = function Navigation({ backLabel = "Back", nextLabel = "Next", completeLabel = "Start Creating" }: { backLabel?: string; nextLabel?: string; completeLabel?: string }) { const { currentStep, totalSteps, handleNext, handleBack } = useOnboarding(); return <div className="mt-6 flex justify-between"><Button type="button" variant="ghost" onClick={handleBack} disabled={currentStep === 1}>{backLabel}</Button><Button type="button" onClick={handleNext}>{currentStep === totalSteps ? completeLabel : nextLabel}</Button></div> }

function FeatureCarousel({ children }: { children: React.ReactNode }) { return <div className="space-y-2">{children}</div> }
FeatureCarousel.Item = function Item({ children, index }: { children: React.ReactNode; index: number }) { const { stepValue, setStepValue } = useOnboarding(); return <button type="button" onClick={() => setStepValue(index)} aria-pressed={stepValue === index} className="block w-full text-left">{children}</button> }
function ChoiceGroup({ name, value, onValueChange, children, className }: { name: string; value: string | null; onValueChange: (value: string) => void; children: React.ReactNode; className?: string }) { return <div role="radiogroup" aria-label={name} className={className}>{React.Children.map(children, (child) => React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<{ selectedValue?: string | null; onSelect?: (value: string) => void }>, { selectedValue: value, onSelect: onValueChange }) : child)}</div> }
ChoiceGroup.Item = function Item({ value, children, selectedValue, onSelect, className }: { value: string; children: React.ReactNode; selectedValue?: string | null; onSelect?: (value: string) => void; className?: string }) { return <button type="button" role="radio" aria-checked={selectedValue === value} onClick={() => onSelect?.(value)} className={cn(className, selectedValue === value && "border-primary bg-primary/10")}>{children}</button> }
function TipsList({ title, children }: { title?: string; children: React.ReactNode }) { return <div><p className="sr-only">{title}</p><ol className="space-y-3">{children}</ol></div> }
TipsList.Item = function Item({ number, children }: { number?: number; children: React.ReactNode }) { return <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs">{number}</span><div>{children}</div></li> }

export { Onboarding, FeatureCarousel, ChoiceGroup, TipsList, useOnboarding }
