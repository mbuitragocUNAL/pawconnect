"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Consent, Field, Notice, Steps } from "@/components/pawconnect/form"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [consent, setConsent] = useState(false)
  const [accountExists, setAccountExists] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const sendCode = async () => {
    setError("")
    const celular = phone.startsWith("+") ? phone : `+57${phone.replace(/\D/g, "")}`
    if (!/^(\+57)?3\d{9}$/.test(celular)) {
      setError("Ingresa un celular colombiano válido.")
      return
    }
    setBusy(true)
    try {
      const result = await apiFetch<{ enviado: boolean; cuenta_existente: boolean }>("/cuentas/codigo/", {
        method: "POST",
        body: JSON.stringify({ celular }),
      })
      setAccountExists(result.cuenta_existente)
      setPhone(celular)
      setStep(2)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos enviar el código.")
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    setError("")
    if (!/^\d{6}$/.test(code)) {
      setError("El código debe tener seis dígitos.")
      return
    }
    setBusy(true)
    try {
      const result = await apiFetch<{
        token: string
        usuario: {
          id: string
          nombre_publico: string
          celular: string
          rol: string
          nivel_verificacion: number
          zona_principal: string
        }
      }>("/cuentas/verificar/", {
        method: "POST",
        body: JSON.stringify({
          celular: phone,
          codigo: code,
          nombre_publico: accountExists ? "" : name,
          acepta_tratamiento: accountExists ? true : consent,
          version_texto: "2026-11",
        }),
      })
      login(result.token, result.usuario)
      router.push("/mis-casos")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "El código no es válido.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-[480px] px-4 pt-8 pb-28 desk:pt-16">
      <Steps current={step} total={2} />
      <h1 className="mt-4 text-[clamp(30px,5vw,48px)] tracking-[-0.04em]">
        {step === 1 ? "Ingresa con tu celular" : "Verifica el código"}
      </h1>
      {error ? <Notice tone="danger" className="mt-5" title="No pudimos continuar">{error}</Notice> : null}
      {step === 1 ? (
        <div className="mt-6 flex flex-col gap-5">
          <Field label="Celular" help="Usa un número colombiano de 10 dígitos.">
            <div className="flex gap-2">
              <span className="grid h-12 w-16 place-items-center rounded-field border border-line-strong bg-surface text-sm font-medium">+57</span>
              <Input
                value={phone.replace(/^\+57/, "")}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="tel"
                placeholder="3001234567"
              />
            </div>
          </Field>
          <Button block disabled={busy} onClick={sendCode}>
            {busy ? "Enviando…" : "Enviar código por SMS"}
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <Field label="Código de seis dígitos">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="font-mono tracking-[0.45em]"
            />
          </Field>
          {!accountExists ? (
            <>
              <Field label="Nombre público" help="Opcional. Puedes dejarlo en blanco.">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" />
              </Field>
              <Consent
                title="Acepto el tratamiento de datos"
                checked={consent}
                onCheckedChange={setConsent}
              >
                Versión 2026-11. Obligatorio para crear una cuenta nueva.
              </Consent>
            </>
          ) : (
            <Notice tone="privacy" title="Cuenta existente">
              Solo ingresa el código. No necesitas volver a aceptar el consentimiento ni cambiar el nombre.
            </Notice>
          )}
          <div className="flex gap-2">
            <Button variant="tonal" onClick={() => setStep(1)}>Cambiar número</Button>
            <Button block disabled={busy} onClick={verify}>
              {busy ? "Verificando…" : "Verificar e ingresar"}
            </Button>
          </div>
          <button type="button" className="text-sm underline underline-offset-4" onClick={sendCode}>
            Reenviar código
          </button>
        </div>
      )}
    </section>
  )
}
