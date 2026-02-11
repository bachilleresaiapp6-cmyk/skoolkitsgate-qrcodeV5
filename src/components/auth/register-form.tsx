"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ROLES, Role, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { registerUser } from "@/lib/api";
import { Loader2, User as UserIcon, Users, Presentation, UserCog, Briefcase } from "lucide-react";
import { normalizeName } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schoolIdRegex = /^ESC-\d{4}$/;
const curpRegex = /^[A-Z0-9]{18}$/;

const formSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
  rol: z.enum(ROLES, { errorMap: () => ({ message: "Por favor, selecciona un rol." }) }),
  idEscuela: z.string().optional(),
  curp: z.string().optional(),
  grado: z.string().optional(),
  grupo: z.string().optional(),
  turno: z.string().optional(),
}).superRefine((data, ctx) => {
    const rolesRequireSchoolId: Role[] = ['Alumno', 'Docente', 'Administrativo'];
    if (rolesRequireSchoolId.includes(data.rol)) {
        if (!data.idEscuela || data.idEscuela.trim() === '') {
             ctx.addIssue({
                code: 'custom',
                path: ['idEscuela'],
                message: 'El código de escuela es obligatorio para este rol.',
            });
        } else if (!schoolIdRegex.test(data.idEscuela)) {
            ctx.addIssue({
                code: 'custom',
                path: ['idEscuela'],
                message: 'El código de escuela debe tener el formato ESC-XXXX.',
            });
        }
    }
    if (data.rol === 'Alumno') {
        if (!data.curp || !curpRegex.test(data.curp.toUpperCase())) {
            ctx.addIssue({
                code: 'custom',
                path: ['curp'],
                message: 'La CURP es obligatoria para alumnos y debe tener 18 caracteres.'
            });
        }
    }
});

const roleIcons: Record<Role, React.ElementType> = {
  "Alumno": UserIcon,
  "Tutor": Users,
  "Docente": Presentation,
  "Director": UserCog,
  "Administrativo": Briefcase,
};

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      rol: 'Alumno',
      idEscuela: "",
      curp: "",
      grado: "1",
      grupo: "A",
      turno: "Matutino",
    },
  });

  const { isSubmitting } = form.formState;

  const selectedRole = form.watch("rol");
  const rolesThatRequireSchoolIdInput: Role[] = ['Alumno', 'Docente', 'Administrativo'];
  const showSchoolIdField = rolesThatRequireSchoolIdInput.includes(selectedRole);
  const showStudentFields = selectedRole === 'Alumno';

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let finalValues: any = { ...values };
    
    if (finalValues.rol === 'Director') {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        finalValues.idEscuela = `ESC-${randomNum}`;
    }
    
    const normalizedValues = {
        ...finalValues,
        nombre: normalizeName(finalValues.nombre),
        curp: finalValues.curp ? finalValues.curp.toUpperCase() : undefined,
    };

    try {
      const result = await registerUser(normalizedValues);
      if (result.status === 'success' && result.data) {
        toast({
          title: "Registro Exitoso",
          description: "Tu credencial ha sido generada.",
        });
        const encodedData = btoa(JSON.stringify(result.data));
        
        if(values.rol === 'Tutor') {
            localStorage.setItem('qrGateUser', JSON.stringify(result.data.user));
            router.push(`/dashboard/tutor`);
        } else {
            router.push(`/credential?data=${encodedData}`);
        }
      } else {
        if (result.message && result.message.includes("El email ya está registrado")) {
            toast({
                variant: "destructive",
                title: "Este email ya existe",
                description: "El correo que ingresaste ya está en uso. Por favor, inicia sesión o usa un correo diferente.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error de Registro",
                description: result.message || "No se pudo completar el registro.",
            });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Tu Nombre Completo" 
                  {...field} 
                  pattern="[A-Z\s]+"
                  title="Solo letras mayúsculas y espacios"
                  onInput={(e) => {
                    const input = e.target as HTMLInputElement;
                    const normalized = normalizeName(input.value);
                    input.value = normalized;
                    field.onChange(normalized);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="rol"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Tipo de Usuario</FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
                >
                  {ROLES.map((role) => {
                    const Icon = roleIcons[role];
                    const id = role.toLowerCase();

                    return (
                       <FormItem key={id} className="w-full">
                         <FormControl>
                           <RadioGroupItem value={role} id={id} className="sr-only peer" />
                         </FormControl>
                         <FormLabel htmlFor={id} className="font-normal">
                          <Card className="cursor-pointer border-2 border-muted bg-white p-0 text-gray-800 transition-all duration-300 hover:border-[#ff9800] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#ff9800]/20 peer-data-[state=checked]:border-[#ff9800] peer-data-[state=checked]:bg-[#ff9800] peer-data-[state=checked]:text-white peer-data-[state=checked]:shadow-xl peer-data-[state=checked]:shadow-[#ff9800]/30">
                            <CardContent className="flex flex-col items-center justify-center p-4 h-full">
                              <Icon className="mb-2 h-6 w-6 text-muted-foreground transition-colors peer-data-[state=checked]:text-white" />
                              <span className="font-semibold text-center text-xs transition-colors peer-data-[state=checked]:text-white">{role}</span>
                            </CardContent>
                          </Card>
                        </FormLabel>
                       </FormItem>
                    );
                  })}
                </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showSchoolIdField && (
            <FormField
                control={form.control}
                name="idEscuela"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Código Escuela</FormLabel>
                    <FormControl>
                    <Input placeholder="ESC-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        {showStudentFields && (
            <>
                <FormField
                    control={form.control}
                    name="curp"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>CURP</FormLabel>
                        <FormControl>
                        <Input placeholder="CURP de 18 caracteres" {...field} onInput={(e) => {
                            const input = e.target as HTMLInputElement;
                            input.value = input.value.toUpperCase();
                            field.onChange(input.value);
                        }} maxLength={18} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="grid grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name="grado"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Grado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {[...Array(6)].map((_, i) => <SelectItem key={i+1} value={`${i+1}`}>{i+1}°</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="grupo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Grupo</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {"ABCDEFGHIJKLM".split('').map(letter => <SelectItem key={letter} value={letter}>{letter}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="turno"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Turno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Matutino">Matutino</SelectItem>
                                <SelectItem value="Vespertino">Vespertino</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </>
        )}
        
        <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar y Generar Credencial"
          )}
        </Button>
      </form>
    </Form>
  );
}
