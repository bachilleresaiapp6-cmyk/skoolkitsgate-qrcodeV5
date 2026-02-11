"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { requestPasswordReset, verifyResetCode, updatePassword } from "@/lib/api";
import { useRouter } from "next/navigation";

const emailSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
});

const codeSchema = z.object({
  code: z.string().length(6, { message: "El código debe tener 6 dígitos." }),
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});

type Step = 1 | 2 | 3;

export function PasswordResetForm() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const codeForm = useForm<z.infer<typeof codeSchema>>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "", confirmPassword: "" } });

  const isSubmitting = emailForm.formState.isSubmitting || codeForm.formState.isSubmitting || passwordForm.formState.isSubmitting;

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    const result = await requestPasswordReset(values.email);
    if (result.status === "success") {
      toast({ title: "Éxito", description: result.message });
      setEmail(values.email);
      setStep(2);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  const onCodeSubmit = async (values: z.infer<typeof codeSchema>) => {
    const result = await verifyResetCode(email, values.code);
    if (result.status === "success") {
      toast({ title: "Éxito", description: result.message });
      setCode(values.code);
      setStep(3);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    const result = await updatePassword(email, code, values.password);
    if (result.status === "success") {
      toast({ title: "Éxito", description: result.message });
      setTimeout(() => router.push("/auth"), 3000);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.message });
    }
  };

  const variants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="relative overflow-hidden h-60">
      <AnimatePresence>
        {step === 1 && (
          <motion.div key={1} initial="enter" animate="center" exit="exit" variants={variants} transition={{ duration: 0.3 }} className="absolute w-full">
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                <FormField control={emailForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="tu@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar código de recuperación"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key={2} initial="enter" animate="center" exit="exit" variants={variants} transition={{ duration: 0.3 }} className="absolute w-full">
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="space-y-6">
                <FormField control={codeForm.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de 6 dígitos</FormLabel>
                    <FormControl><Input placeholder="_ _ _ _ _ _" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Verificar código"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key={3} initial="enter" animate="center" exit="exit" variants={variants} transition={{ duration: 0.3 }} className="absolute w-full">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField control={passwordForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Actualizar contraseña"}
                </Button>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
