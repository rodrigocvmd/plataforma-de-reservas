import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface ReservationTime {
	resourceId: number;
	startTime: Date;
	endTime: Date;
}

export const isTimeSlotAvailable = async ({
	resourceId,
	startTime,
	endTime,
}: ReservationTime): Promise<{ available: boolean; reason?: string }> => {
	const resource = await prisma.resource.findUnique({
		where: { id: resourceId },
		select: { isBlocked: true },
	});
	if (!resource) {
		return { available: false, reason: "Recurso não encontrado." };
	}
	if (resource.isBlocked) {
		return { available: false, reason: "O recurso está bloqueado." };
	}

	const schedule = await prisma.schedule.findFirst({
		where: {
			resourceId,
			isAvailable: true,
			startTime: { lte: startTime },
			endTime: { gte: endTime },
		},
	});
	if (!schedule) {
		return { available: false, reason: "Horário não está marcado como disponível." };
	}

	const conflictUnavailableSlot = await prisma.unavailableSlot.findFirst({
		where: {
			resourceId,
			startTime: { lt: endTime },
			endTime: { gt: startTime },
		},
	});

	if (conflictUnavailableSlot) {
		return { available: false, reason: "Bloqueio de horário conflitante." };
	}

	return { available: true };
};
