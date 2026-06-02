  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'If the email exists, an OTP has been sent.' };
    }

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    let attempts = user.otpVerification?.otp_attempts || 0;
    if (
      user.otpVerification?.last_otp_requested_at &&
      user.otpVerification.last_otp_requested_at < threeHoursAgo
    ) {
      attempts = 0;
    }

    if (attempts >= 3) {
      throw new ForbiddenException(
        'Too many attempts. Please try again in 3 hours.',
      );
    }

    const otp = this.generateOtp();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    await this.prisma.otpVerification.upsert({
      where: { userId: user.id },
      update: {
        otp_code: otp,
        otp_expires_at: otpExpires,
        otp_attempts: attempts + 1,
        last_otp_requested_at: new Date(),
      },
      create: {
        userId: user.id,
        otp_code: otp,
        otp_expires_at: otpExpires,
        otp_attempts: 1,
        last_otp_requested_at: new Date(),
      },
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'FlowGov - Reset Password OTP',
      html: `
        <h2>Reset Password</h2>
        <p>Your OTP for resetting password is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return { message: 'If the email exists, an OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { otpVerification: true },
    });

    if (!user || !user.otpVerification) {
      throw new BadRequestException('Invalid request');
    }

    if (new Date() > user.otpVerification.otp_expires_at) {
      throw new BadRequestException('OTP expired');
    }

    if (user.otpVerification.otp_code !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      this.prisma.otpVerification.delete({
        where: { userId: user.id },
      }),
      this.prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'Password has been reset successfully' };
  }
