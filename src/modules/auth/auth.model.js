import prisma from "../../config/prisma.js";

export async function findUserByPhoneNumber(phoneNumber) {
    return prisma.user.findUnique({
        where: { phoneNumber },
    });
}

export function createUser(data) {
    return prisma.user.create({
        data,
    });
}

export function findUserById(id) {
    return prisma.user.findUnique({
        where: { id },
    });
}