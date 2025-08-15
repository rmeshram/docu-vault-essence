-- Fix the syntax error and add RLS policies
-- Fix analytics table unique constraint
ALTER TABLE public.analytics DROP CONSTRAINT IF EXISTS analytics_user_id_type_period_date_key;
CREATE UNIQUE INDEX idx_analytics_unique ON public.analytics(user_id, type, period, date_trunc('day', generated_at));

-- Create comprehensive RLS policies
-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can manage their own documents" ON public.documents
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Family members can view shared documents" ON public.documents
    FOR SELECT USING (
        family_id IN (
            SELECT vault_id FROM public.family_members 
            WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
            AND status = 'accepted'
        )
    );

-- Document relationships policies
CREATE POLICY "Users can view relationships for their documents" ON public.document_relationships
    FOR SELECT USING (
        doc_id1 IN (SELECT id FROM public.documents WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
        OR doc_id2 IN (SELECT id FROM public.documents WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
    );

-- Summaries policies
CREATE POLICY "Users can manage summaries of their documents" ON public.summaries
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Chats policies
CREATE POLICY "Users can manage their own chats" ON public.chats
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Reminders policies
CREATE POLICY "Users can manage their own reminders" ON public.reminders
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Family vaults policies
CREATE POLICY "Users can manage vaults they own" ON public.family_vaults
    FOR ALL USING (owner_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Family members can view shared vaults" ON public.family_vaults
    FOR SELECT USING (
        id IN (
            SELECT vault_id FROM public.family_members 
            WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
            AND status = 'accepted'
        )
    );

-- Family members policies
CREATE POLICY "Vault owners can manage members" ON public.family_members
    FOR ALL USING (
        vault_id IN (
            SELECT id FROM public.family_vaults 
            WHERE owner_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can view their own memberships" ON public.family_members
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Professionals policies
CREATE POLICY "Users can manage their own professional profile" ON public.professionals
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can view verified professionals" ON public.professionals
    FOR SELECT USING (verified = true AND is_active = true);

-- Marketplace templates policies
CREATE POLICY "Professionals can manage their templates" ON public.marketplace_templates
    FOR ALL USING (
        professional_id IN (
            SELECT id FROM public.professionals 
            WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Anyone can view active templates" ON public.marketplace_templates
    FOR SELECT USING (is_active = true);

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON public.analytics
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can insert analytics" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
    FOR ALL WITH CHECK (true);

-- Payment transactions policies
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "System can manage transactions" ON public.payment_transactions
    FOR ALL WITH CHECK (true);

-- Compliance reports policies
CREATE POLICY "Users can view their own reports" ON public.compliance_reports
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Professionals can view reports they generated" ON public.compliance_reports
    FOR SELECT USING (
        professional_id IN (
            SELECT id FROM public.professionals 
            WHERE user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Audit logs policies (admin only)
CREATE POLICY "System can manage audit logs" ON public.audit_logs
    FOR ALL WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Document shares policies
CREATE POLICY "Users can manage shares they created" ON public.document_shares
    FOR ALL USING (shared_by IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view shares made to them" ON public.document_shares
    FOR SELECT USING (
        shared_with_user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        OR is_public = true
    );