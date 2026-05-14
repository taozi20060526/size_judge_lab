# -*- coding: utf-8 -*-
# 赵钰涛：将临时 assets 按顺序重命名为 stimuli/ 下中文文件名（一次性辅助脚本，非实验运行所必需）。
import os
import shutil

ASSETS = r"C:\Users\28580\.cursor\projects\c-Users-28580-Desktop\assets"
OUT = r"C:\Users\28580\Desktop\size_judge_lab\stimuli"

# 46 条上传顺序；跳过第 35 条（1-based）即索引 34 的重复 _____31_
SOURCES_46 = [
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____2_-7eaf32e2-b0cc-4bf3-81c5-b4f289d43d64.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____9_-4a02842b-29ec-4cac-bb01-6f8e81d2fa22.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____8_-128fd184-7a77-4b03-bbe0-096dc245b941.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____10_-e68057a5-2a0f-484c-9ea3-b00deeec9614.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____7_-25e00153-2fbe-46eb-bc51-0453d65d03bb.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____1_-9876d73d-3c0a-4403-b4bc-a4a199bab520.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____6_-5464c577-22b8-4d3a-a8b5-7d809ac09551.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____5_-2347c822-d08b-4c8d-a1e5-34bd25007690.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____4_-86cddeb9-9fae-4a02-9f61-cc1e6bcd2b50.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____3_-49266ee9-e5cc-4a96-ace1-34d70d1e42e4.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____34_-87279892-a03b-4e3c-a818-9ffad8def68f.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____12_-46d03d6b-16d8-4686-b62f-ce157d97e228.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____32_-df135800-ee59-44ed-bb85-3effeb4526ed.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____30_-1b02c99b-a550-4ae7-b401-d3d63b9f931e.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____29_-bc70d3ca-a2c3-4b4a-88cf-8bca6881b6ca.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____33_-d7ca6e6e-1a50-4deb-8b42-4f32012fefe9.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____11_-a0cdb3b8-a544-492b-839a-0ed79109e859.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____28_-3f7009a3-664a-49a8-80d9-6cfa6c680fc5.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____31_-26567066-39e4-44ad-a9aa-90d738a9d9ed.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____26_-c3f689cb-6531-4b37-86ce-9d352480f4a7.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____25_-c7b3f0d0-ed1f-49c2-859e-c7f836ff767d.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____24_-2b1b8ee5-e30d-43f1-bd40-5e9e7a0bb372.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____27_-c439752a-f4c6-4564-9208-bb6f0e7e4664.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____22_-a4640079-f5f7-470e-a250-9bd3e4327aec.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____17_-0cfa26e1-00bb-4618-b25d-b12183f72eea.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____18_-6a3ed28c-3a75-4480-a6b3-d8b6b429d1b5.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____20_-371272dc-2c43-4568-bbfc-4dbdfa70b14e.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____21_-ef8fe954-4ae4-4846-87f9-70e59824efd6.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____19_-12fd0934-39b5-4d7e-bef3-cc0bc4c458b7.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____14_-e7fe58fc-6b87-4baa-bccf-c1b1f5e97d5a.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____15_-1268734a-9907-49e6-8554-7846c98674bc.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____23_-fed289dd-9e93-42b3-9db1-461d509fed98.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____13_-948a9a3d-9fd1-4940-8d86-cd1271ebeb3b.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____16_-1895ee08-cfea-44aa-939d-2eef5884fb7f.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____31_-26567066-39e4-44ad-a9aa-90d738a9d9ed-7d53a6b0-1939-4412-8425-5cba7ad6e32f.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____35_-e5c15d7c-551a-4173-bfcb-7aceba385a42.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____37_-e92ee295-89be-4fe8-9e41-09994f6f6fc6.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____36_-450fd0d9-2a72-40e9-b111-c126d406849e.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____41_-d5a4b100-ef3c-4078-9a0c-4174ef178b62.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____40_-17dba870-1557-4b9f-86db-78852168b876.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____39_-ef312ed9-8778-4038-834a-81e305bb08cc.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____42_-07e746c4-63fa-487e-98c1-493d3827a016.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____38_-f5de9c37-b728-4ff1-9323-1c2df36c74a7.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____43_-2d2a06ad-117c-46c8-897e-5f62854388a8.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____44_-3b3c288b-d629-47f8-b4c1-f3405be63925.png",
    "c__Users_28580_AppData_Roaming_Cursor_User_workspaceStorage_c9ed0e26a30848fa86ee3426e8ea1f93_images_____45_-85175fdf-c9a1-4e6c-bd6f-04db431aefb8.png",
]

NAMES_45 = [
    "斑马", "老鼠", "大象", "鲸鱼", "皮划艇", "金鱼", "轮船", "仓鼠", "狮子", "台灯",
    "碗", "高楼", "单人椅", "平板", "笔记本电脑", "平底锅", "蜻蜓", "网球", "沙发", "滑板车",
    "自行车", "床头柜", "篮球", "微波炉", "西瓜", "樱桃", "狗", "冰箱", "马", "飞机",
    "公交车", "衣柜", "狗屋", "滑板",
    "枕头", "电动牙刷", "吹风机", "保温杯", "手电筒", "计算器", "电水壶", "键盘", "背包", "手提包", "床",
]


def main():
    assert len(SOURCES_46) == 46
    assert len(NAMES_45) == 45
    order_src = SOURCES_46[:34] + SOURCES_46[35:]
    assert len(order_src) == 45

    os.makedirs(OUT, exist_ok=True)
    missing = []
    for i, (base, cn) in enumerate(zip(order_src, NAMES_45)):
        src = os.path.join(ASSETS, base)
        dst = os.path.join(OUT, cn + ".png")
        if not os.path.isfile(src):
            missing.append((i, base))
            continue
        shutil.copy2(src, dst)
        print("ok", i + 1, cn)

    if missing:
        print("MISSING:", missing)
        raise SystemExit(1)
    print("done: 45 files ->", OUT)


if __name__ == "__main__":
    main()
