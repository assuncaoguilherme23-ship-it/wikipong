/**
 * WikiPong · Entrar por link no e-mail
 * ------------------------------------------------------------------------------
 * Um campo e um botão. Sem senha, sem cadastro, sem "confirme sua senha".
 *
 * A tela nunca diz se o e-mail existe ou não: a resposta é sempre "olhe a sua
 * caixa". Dizer "não achei esse e-mail" entregaria a quem estivesse fuçando a
 * lista de quem tem conta aqui.
 */
'use client';

import { useState } from 'react';
import { pedirLink, loginDisponivel } from '@/src/logica/sessao';
import estilos from './Login.module.css';

export function Login({ titulo, explicacao }: { titulo: string; explicacao: string }) {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'parado' | 'enviando' | 'enviado' | 'erro'>('parado');
  const [erro, setErro] = useState('');

  if (!loginDisponivel()) {
    return (
      <p className={estilos.semBackend}>
        O login depende do servidor, que ainda não está ligado. Enquanto isso o site funciona
        inteiro sem conta, gravando no seu navegador.
      </p>
    );
  }

  if (estado === 'enviado') {
    return (
      <div className={estilos.enviado}>
        <p className={estilos.enviadoTitulo}>Olhe a sua caixa de entrada.</p>
        <p>
          Se houver conta para <strong>{email}</strong>, o link de entrada chegou. Ele vale por
          pouco tempo e só funciona uma vez.
        </p>
        <button type="button" className={estilos.linkAcao} onClick={() => setEstado('parado')}>
          usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form
      className={estilos.form}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!email.includes('@')) {
          setErro('Falta o e-mail.');
          setEstado('erro');
          return;
        }
        setEstado('enviando');
        try {
          /* Volta pra esta mesma página: o link tem que devolver a pessoa onde
             ela estava, não na home. Esta URL precisa estar na lista de
             permitidas do projeto (Authentication → URL Configuration). */
          await pedirLink(email.trim(), window.location.origin + window.location.pathname);
          setEstado('enviado');
        } catch (err) {
          setErro(err instanceof Error ? err.message : 'Não deu pra enviar o link.');
          setEstado('erro');
        }
      }}
    >
      <h2 className={estilos.titulo}>{titulo}</h2>
      <p className={estilos.explicacao}>{explicacao}</p>

      <label className={estilos.campo}>
        <span className={estilos.rotulo}>Seu e-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          aria-invalid={estado === 'erro'}
        />
      </label>

      {estado === 'erro' && (
        <p className={estilos.erro} role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="botao-primario" disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Enviando…' : 'Receber link de entrada'}
      </button>

      <p className={estilos.nota}>
        Sem senha: o link que chega no e-mail é a prova de que a conta é sua.
      </p>
    </form>
  );
}
