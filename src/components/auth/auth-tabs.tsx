import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { EnrollmentForm } from "@/components/auth/enrollment-form";
import { CardContent } from "@/components/ui/card";

export function AuthTabs() {
  return (
    <Tabs defaultValue="register" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="register">Registro</TabsTrigger>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="enrollment">Inscripción</TabsTrigger>
      </TabsList>
      <TabsContent value="register">
        <CardContent className="pt-6">
          <RegisterForm />
        </CardContent>
      </TabsContent>
      <TabsContent value="login">
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </TabsContent>
      <TabsContent value="enrollment">
        <CardContent className="pt-6">
          <EnrollmentForm />
        </CardContent>
      </TabsContent>
    </Tabs>
  );
}
