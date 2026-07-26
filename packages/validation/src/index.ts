import { z } from 'zod';

export const CreateProjectFormSchema = z.object({
  name: z.string().min(2, 'O nome do projeto deve ter no mínimo 2 caracteres.').max(100, 'O nome não pode exceder 100 caracteres.'),
  description: z.string().max(500, 'A descrição não pode exceder 500 caracteres.').optional(),
  unit: z.enum(['mm', 'cm', 'm']),
  width: z.number().positive('A largura deve ser um valor positivo.'),
  height: z.number().positive('A altura deve ser um valor positivo.'),
  gridSize: z.number().positive('O tamanho da grade deve ser um valor positivo.'),
});

export type CreateProjectFormData = z.infer<typeof CreateProjectFormSchema>;

export const LayerFormSchema = z.object({
  name: z.string().min(1, 'O nome da camada é obrigatório.').max(50, 'Nome de camada muito longo.'),
});

export type LayerFormData = z.infer<typeof LayerFormSchema>;
