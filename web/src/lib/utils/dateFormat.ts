export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) {
    return 'agora mesmo';
  }

  if (minutes < 60) {
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (hours < 24) {
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  if (days < 7) {
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  if (weeks < 4) {
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }

  if (months < 12) {
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

export function formatFutureRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'expirado';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (minutes < 60) {
    return `em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (hours < 24) {
    return `em ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  if (days < 7) {
    return `em ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  return `em ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
}
