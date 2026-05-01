import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../database/supabaseconfig';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Failsafe: Si Supabase se traba (ej. por red o localStorage corrupto), liberamos la pantalla después de 3 segundos
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // 1. Obtener sesión actual
    const getSessionAndRole = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        const currentSession = data?.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error al obtener sesión:", err);
        setLoading(false);
      }
    };

    getSessionAndRole();

    // 2. Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchUserRole(currentSession.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(failsafeTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      // Obtenemos el rol elegido en la sesión (desde vista_rol)
      const rolActivo = localStorage.getItem("rol-activo");
      
      if (rolActivo) {
        setRole(rolActivo);
      } else {
        // Si no ha elegido, forzamos null para que vaya a /seleccion-rol
        setRole(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (newRole) => {
    localStorage.setItem("rol-activo", newRole);
    setRole(newRole);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión en Supabase:", err);
    } finally {
      localStorage.removeItem("usuario-supabase"); 
      localStorage.removeItem("usuario"); // Limpieza de datos viejos por si acaso
      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false); // FORZAR que el spinner desaparezca
    }
  };

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
    changeRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
